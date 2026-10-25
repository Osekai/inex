import sharp from 'sharp';
import { appendFile, readdir, readFile, writeFile } from 'fs/promises';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { optimize } from 'svgo';
import { fileURLToPath } from 'url';

process.chdir(dirname(fileURLToPath(import.meta.url)));

const execFileAsync = promisify(execFile);
const REPO_URL = 'https://github.com/ppy/osu-resources';
const CACHE_DIR = '.cache/osu-resources';
const MEDALS_DIR = `${CACHE_DIR}/assets/medals`;
const BASE_DIR = `${MEDALS_DIR}/base`;
const OUTPUT_DIR = '../assets/medals';
const CLIENT_DIR = `${OUTPUT_DIR}/client`;
const WEB_DIR = `${OUTPUT_DIR}/web`;
const BASES_DIR = `${OUTPUT_DIR}/bases`;
const JSON_PATH = '../assets/medals.json';
const REV_PATH = '../frontend/rev.txt';
const colours = ['purple', 'pink', 'red', 'bronze', 'silver', 'gold', 'blue', 'grey', 'green'];
const offset = { left: 10, top: 4 };

// usage: node add_medals.js [--no-pull]
if (!process.argv.includes('--no-pull')) {
    console.log('Pulling latest osu-resources (medals only)');
    if (!existsSync(`${CACHE_DIR}/.git`)) {
        mkdirSync(CACHE_DIR, { recursive: true });
        await execFileAsync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', REPO_URL, CACHE_DIR]);
        await execFileAsync('git', ['sparse-checkout', 'set', 'assets/medals'], { cwd: CACHE_DIR });
    } else {
        await execFileAsync('git', ['fetch', '--depth', '1', 'origin', 'master'], { cwd: CACHE_DIR });
        await execFileAsync('git', ['reset', '--hard', 'FETCH_HEAD'], { cwd: CACHE_DIR });
    }
}

const oldJson = await readFile(JSON_PATH, 'utf8');
const medalsJson = JSON.parse(oldJson);

// find svgs that aren't in medals.json yet
const missing = [];
for (const colour of colours) {
    const files = (await readdir(`${MEDALS_DIR}/${colour}`)).filter(f => extname(f) === '.svg');
    for (const file of files) {
        const name = basename(file, '.svg');
        if (medalsJson.medals[name] == null) {
            missing.push({ name, colour, path: join(MEDALS_DIR, colour, file) });
        }
    }
}

if (missing.length == 0) {
    console.log('No new medals found, nothing to do');
    process.exit(0);
}

const dropShadowBuf = await sharp(`${BASE_DIR}/dropshadow.png`)
    .resize(408, 439)
    .png()
    .toBuffer();

for (const medal of missing) {
    console.log(`Adding ${medal.name} (${medal.colour})`);

    const raw = await readFile(medal.path, 'utf8');
    const { data: svg } = optimize(raw, { multipass: true });
    medalsJson.medals[medal.name] = { colour: medal.colour, svg };

    const clientBase = await sharp(`${BASES_DIR}/${medal.colour}.png`).toBuffer();
    const webBase = await sharp(dropShadowBuf)
        .composite([{ input: clientBase, left: offset.left, top: offset.top }])
        .png()
        .toBuffer();

    const icon = await sharp(medal.path).png().toBuffer();

    const clientComposited = await sharp(clientBase)
        .composite([{ input: icon }])
        .png()
        .toBuffer();

    const webComposited = await sharp(webBase)
        .composite([{ input: icon, left: offset.left, top: offset.top }])
        .png()
        .toBuffer();

    await Promise.all([
        sharp(clientComposited).resize(385, 417).png().toFile(`${CLIENT_DIR}/${medal.name}@2x.png`),
        sharp(clientComposited).resize(193, 209).png().toFile(`${CLIENT_DIR}/${medal.name}.png`),
        sharp(webComposited).resize(248, 248, { fit: 'inside' }).png().toFile(`${WEB_DIR}/${medal.name}@2x.png`),
        sharp(webComposited).resize(111, 119, { fit: 'inside' }).png().toFile(`${WEB_DIR}/${medal.name}.png`),
    ]);
}

const json = JSON.stringify(medalsJson);
await writeFile(JSON_PATH, json);
await pipeline(
    Readable.from(json),
    createGzip(),
    createWriteStream(`${JSON_PATH}.gz`)
);

if (json != oldJson) {
    // medals changed, bump the revision so cached medals.json.gz urls change
    await appendFile(REV_PATH, 'a');
    console.log('Bumped revision in frontend/rev.txt');
}

console.log(`Added ${missing.length} medal(s), updated medals.json and medals.json.gz`);
