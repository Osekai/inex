import svgtofont from 'svgtofont';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log(__dirname);
const realSrcDir = path.resolve(__dirname, './src/icons');
const distDir = path.resolve(__dirname, '../src/fonts/iconfont');

function findSvgFiles(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findSvgFiles(fullPath));
        } else if (entry.name.endsWith('.svg')) {
            results.push(fullPath);
        }
    }
    return results;
}

// svgtofont only reads one level deep, so flatten nested folders into a tmp dir first
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anthera-icons-'));

for (const file of findSvgFiles(realSrcDir)) {
    // copy only, never touch the real source files
    const flatName = path.relative(realSrcDir, file).split(path.sep).join('-');
    fs.copyFileSync(file, path.join(tmpDir, flatName));
}

try {
    await svgtofont({
        src: tmpDir,
        dist: distDir,
        fontName: 'icons',
        classNamePrefix: 'icon',
        css: { fontSize: 'inherit' },
        emptyDist: false, // dist has the real src/ folder as a sibling, never wipe it
        useCSSVars: false,
        outSVGReact: false,
        outSVGPath: false,
        svgicons2svgfont: {
            fontHeight: 1000,
            normalize: false,
        },
        generateInfoData: false,
    });
} finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
}

// svgtofont always writes these regardless of config, we don't use them
for (const ext of ['.less', '.module.less', '.scss']) {
    const file = path.join(distDir, `icons${ext}`);
    if (fs.existsSync(file)) fs.rmSync(file);
}

console.log('done');