const express = require('express');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const mysql = require("mysql2/promise");
const {resolve} = require("path");
const bodyParser = require("express");

const app = express();
const PORT = 13426;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


async function Screenshot(url) {
    console.log("launching browser");
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--force-device-scale-factor=1'
        ]
    });

    const page = await browser.newPage();


    await page.setViewport({width: 1280, height: 720});
    await page.goto(url, { waitUntil: 'load', timeout: 10000 });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 1000)); // let it actually paint

    var size = await page.evaluate(function () {
        var rect = document.body.getBoundingClientRect();
        return {
            width: Math.ceil(rect.width),
            height: Math.ceil(rect.height)
        };
    });

    await page.setViewport({width: size.width, height: size.height});

    const screenshot = await page.screenshot({ type: 'png', omitBackground: true });
    await browser.close();
    
    console.log("captured screenshot of ", url, " with size ", screenshot.length, " bytes");

    return screenshot;
}

const { Client } = require('memjs');

var cache = Client.create('127.0.0.1:11211');
var cacheSeconds = 3600;

app.get('/banner/:userid/:id.png', async (req, res) => {
    var id = req.params.id;
    var userid = req.params.userid;
    // only allow numeric ids
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({error: 'Invalid banner id'});
    }
    if (!/^\d+$/.test(userid)) {
        return res.status(400).json({error: 'Invalid user id'});
    }

    var cacheKey = "banner:" + id + ":" + userid;
    var url = "http://127.0.0.1:8000/profiles/banner/" + id + "/html?userCheck=" + userid;

    try {
        var cached = await cache.get(cacheKey);
        var screenshot = cached.value;
        var cacheStatus = 'HIT';

        if (!screenshot) {
            screenshot = await Screenshot(url);
            await cache.set(cacheKey, screenshot, {expires: cacheSeconds});
            cacheStatus = 'MISS';
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', screenshot.length);
        res.setHeader('X-Cache', cacheStatus);
        res.end(screenshot);
    } catch (error) {
        res.status(500).json({error: 'Failed to capture screenshot', details: error.message});
    }
});

app.get('/banner/:id/invalidate', async (req, res) => {
    var ip = req.socket.remoteAddress;
    var localAddresses = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

    if (!localAddresses.includes(ip)) {
        return res.status(403).json({error: 'Forbidden'});
    }

    var id = req.params.id;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({error: 'Invalid banner id'});
    }

    try {
        await cache.delete("banner:" + id);
        res.json({success: true});
    } catch (error) {
        res.status(500).json({error: 'Failed to invalidate cache', details: error.message});
    }
});


app.listen(PORT, '127.0.0.1', () => {
    console.log(`Screenshot server running at http://127.0.0.1:${PORT}`);
});