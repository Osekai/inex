import sharp from 'sharp';
import { readdir, readFile, writeFile, rm } from 'fs/promises';
import { mkdirSync, readdirSync, createWriteStream } from 'fs';
import { basename, extname, join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { optimize } from 'svgo';
import * as path from "node:path";

const execFileAsync = promisify(execFile);
const MEDALS_DIR = '../assets/osu/assets/medals';
const SUBMODULE_DIR = '../assets/osu';
const BASE_DIR = `${MEDALS_DIR}/base`;
const OUTPUT_DIR = '../assets/medals';
const CLIENT_DIR = `${OUTPUT_DIR}/client`;
const WEB_DIR = `${OUTPUT_DIR}/web`;
const TMP_DIR = `${OUTPUT_DIR}/bases`;
const colours = ['purple', 'pink', 'red', 'bronze', 'silver', 'gold', 'blue', 'grey', 'green'];
const offset = { left: 10, top: 4 };

mkdirSync(CLIENT_DIR, { recursive: true });
mkdirSync(WEB_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

async function inkscapeExport(svgPath, outPath, tag) {
    return execFileAsync('inkscape', [
        '--export-type=png',
        `--export-filename=${outPath}`,
        svgPath,
    ], {
        env: { ...process.env, INKSCAPE_APP_ID_TAG: `p${process.pid}_${tag}` }
    });
}

console.log("Updating submodule")
let git = await execFileAsync('git', ['submodule', 'update', '--init', '--recursive'], { cwd: SUBMODULE_DIR });
console.log(git.stdout)
console.log("Updating medal comb data");

async function buildMedalsJson() {
    console.log('Building medals JSON mapping...');

    const bases = Object.fromEntries(
        await Promise.all(
            colours.map(async colour => {
                const raw = await readFile(`${BASE_DIR}/medal-${colour}.svg`, 'utf8');
                const { data: svg } = optimize(raw, { multipass: true });
                return [colour, { svg }];
            })
        )
    );

    const medals = Object.fromEntries(
        await Promise.all(
            colours.flatMap(colour => {
                const dir = `${MEDALS_DIR}/${colour}`;
                return readdirSync(dir)
                    .filter(f => extname(f) === '.svg')
                    .map(async file => {
                        const name = basename(file, '.svg');
                        const raw = await readFile(join(dir, file), 'utf8');
                        const { data: svg } = optimize(raw, { multipass: true });
                        return [name, { colour, svg }];
                    });
            })
        )
    );

    const json = JSON.stringify({ bases, medals });
    const outPath = '../assets/medals.json';
    const gzPath = `${outPath}.gz`;

    await writeFile(outPath, json);

    await pipeline(
        Readable.from(json),
        createGzip(),
        createWriteStream(gzPath)
    );

    console.log(`Written to ${outPath} and ${gzPath}`);
}
await buildMedalsJson();

// render medal base pngs with inkscape sequentially (avoids dbus collisions, only 9 runs)
console.log('Rendering base images with Inkscape...');
for (let i = 0; i < colours.length; i++) {
    const colour = colours[i];
    process.stdout.write(`  ${colour}... `);
    await inkscapeExport(`${BASE_DIR}/medal-${colour}.svg`, `${TMP_DIR}/${colour}.png`, `b${i}`);
    console.log('done');
}

// build web bases in sharp: resize dropshadow, composite medal png on top
console.log('Building web bases...');
const dropShadowBuf = await sharp(`${BASE_DIR}/dropshadow.png`)
    .resize(408, 439)
    .png()
    .toBuffer();

const bases = {};
for (const colour of colours) {
    const medalBuf = await sharp(`${TMP_DIR}/${colour}.png`).toBuffer();
    bases[colour] = {
        client: medalBuf,
        web: await sharp(dropShadowBuf)
            .composite([{ input: medalBuf, left: offset.left, top: offset.top }])
            .png()
            .toBuffer(),
    };
}

async function clampBuffer(buf, maxW, maxH) {
    const meta = await sharp(buf).metadata();
    const w = Math.min(meta.width, maxW);
    const h = Math.min(meta.height, maxH);
    if (w === meta.width && h === meta.height) return buf;
    return sharp(buf).extract({ left: 0, top: 0, width: w, height: h }).png().toBuffer();
}

async function processColour(colour) {
    console.log(`Processing ${colour} medals...`);
    const { client: clientBase, web: webBase } = bases[colour];

    const files = (await readdir(`${MEDALS_DIR}/${colour}`)).filter(f => extname(f) === '.svg');

    await Promise.all(files.map(async (file) => {
        const name = basename(file, '.svg');
        const iconPath = join(`${MEDALS_DIR}/${colour}`, file);

        const icon = await sharp(iconPath).png().toBuffer();

        // composite first, snapshot to buffer, then resize separately
        const clientComposited = await sharp(clientBase)
            .composite([{ input: icon }])
            .png()
            .toBuffer();

        const webComposited = await sharp(webBase)
            .composite([{ input: icon, left: offset.left, top: offset.top }])
            .png()
            .toBuffer();

        console.log(`  * ${iconPath}`);

        await Promise.all([
            sharp(clientComposited).resize(385, 417).png().toFile(`${CLIENT_DIR}/${name}@2x.png`),
            sharp(clientComposited).resize(193, 209).png().toFile(`${CLIENT_DIR}/${name}.png`),
            sharp(webComposited).resize(248, 248, { fit: 'inside' }).png().toFile(`${WEB_DIR}/${name}@2x.png`),
            sharp(webComposited).resize(111, 119, { fit: 'inside' }).png().toFile(`${WEB_DIR}/${name}.png`),
        ]);


        const webMeta = await sharp(webBase).metadata();
        console.log('webBase dimensions:', webMeta.width, webMeta.height);
        const iconMeta = await sharp(icon).metadata();
        console.log('icon dimensions:', iconMeta.width, iconMeta.height);
        const webMeta2 = await sharp(webComposited).metadata();
        console.log('webComposited dimensions:', webMeta2.width, webMeta2.height);
    }));
}

for (const colour of colours) {
    await processColour(colour);
}

console.log('Done!');