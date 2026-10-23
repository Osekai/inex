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

dotenv.config({path: resolve('../../.env')});
const config = process.env; // Parse the JSON output

const BASE_URL = config.URL;
console.log("rendering banners from", BASE_URL);


const MAX_PAGES = 4;
const MAX_QUEUE = 50;

var browserPromise = null;
var activePages = 0;
var waiting = [];

// one browser stays open and every screenshot gets its own tab
function GetBrowser() {
    if (browserPromise === null) {
        console.log("launching browser");
        var promise = puppeteer.launch({
            headless: true,
            args: [
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--force-device-scale-factor=1'
            ]
        }).then(function (browser) {
            browser.on('disconnected', function () {
                console.log("browser disconnected, will relaunch");
                browserPromise = null;
            });
            return browser;
        });
        promise.catch(function () {
            browserPromise = null;
        });
        browserPromise = promise;
    }
    return browserPromise;
}

// only MAX_PAGES tabs at once, the rest wait in line
function AcquireSlot() {
    if (activePages < MAX_PAGES) {
        activePages++;
        return Promise.resolve();
    }
    if (waiting.length >= MAX_QUEUE) {
        return Promise.reject(new Error("queue full"));
    }
    return new Promise(function (done) {
        waiting.push(done);
    });
}

function ReleaseSlot() {
    var next = waiting.shift();
    if (next) {
        next();
    } else {
        activePages--;
    }
}

async function Screenshot(url) {
    await AcquireSlot();
    var page = null;
    try {
        var browser = await GetBrowser();
        page = await browser.newPage();

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

        console.log("captured screenshot of ", url, " with size ", screenshot.length, " bytes");

        return screenshot;
    } finally {
        if (page !== null) {
            await page.close().catch(function () {});
        }
        ReleaseSlot();
    }
}

const { Client } = require('memjs');

var cache = Client.create('127.0.0.1:11211');
var cacheSeconds = 3600;

// requests for the same banner while it's rendering share one render
var inflight = {};

async function RenderAndCache(cacheKey, url) {
    var screenshot = await Screenshot(url);
    await cache.set(cacheKey, screenshot, {expires: cacheSeconds});
    return screenshot;
}

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
    var url = BASE_URL + "/profiles/banner/" + id + "/html?userCheck=" + userid;

    try {
        var cached = await cache.get(cacheKey);
        var screenshot = cached.value;
        var cacheStatus = 'HIT';

        if (!screenshot) {
            if (inflight[cacheKey] === undefined) {
                inflight[cacheKey] = RenderAndCache(cacheKey, url).finally(function () {
                    delete inflight[cacheKey];
                });
            }
            screenshot = await inflight[cacheKey];
            cacheStatus = 'MISS';
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', screenshot.length);
        res.setHeader('X-Cache', cacheStatus);
        res.end(screenshot);
    } catch (error) {
        if (error.message === "queue full") {
            return res.status(503).json({error: 'Too many banners rendering, try again soon'});
        }
        res.status(500).json({error: 'Failed to capture screenshot', details: error.message});
    }
});

app.post('/banner/:userid/:id/invalidate', async (req, res) => {
    var ip = req.socket.remoteAddress;
    var localAddresses = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

    if (!localAddresses.includes(ip)) {
        return res.status(403).json({error: 'Forbidden'});
    }

    var id = req.params.id;
    var userid = req.params.userid;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({error: 'Invalid banner id'});
    }
    if (!/^\d+$/.test(userid)) {
        return res.status(400).json({error: 'Invalid user id'});
    }

    try {
        await cache.delete("banner:" + id + ":" + userid);
        // the user's default banner is requested with id 0
        await cache.delete("banner:0:" + userid);
        res.json({success: true});
    } catch (error) {
        res.status(500).json({error: 'Failed to invalidate cache', details: error.message});
    }
});


app.listen(PORT, '127.0.0.1', () => {
    console.log(`Screenshot server running at http://127.0.0.1:${PORT}`);
});