// ported from anthera: frontend/licenses.js
// writes frontend/licences.json, which views/licences.php reads
const fs = require('fs');
const path = require('path');

const NODE_MODULES = path.resolve(__dirname, '../node_modules');
const OUTPUT = path.resolve(__dirname, '../licences.json');
const LICENCE_FILES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md', 'license', 'license.md', 'license.txt'];

// vendored into src/js/external without a package.json entry
const extras = [
    {
        name: 'unicornStudio',
        licenseName: null,
        licenseText: '(license text not found)',
        url: 'https://www.unicorn.studio',
        dependencies: []
    }
];

function getLicenceFromLocal(packagePath) {
    for (const file of LICENCE_FILES) {
        const fullPath = path.join(packagePath, file);
        if (!fs.existsSync(fullPath)) continue;

        const data = fs.readFileSync(fullPath, 'utf-8');
        if (data.trim()) return data;
    }
    return null;
}

function processPackage(packageName, processed) {
    if (processed.has(packageName)) return null;
    processed.add(packageName);

    const packagePath = path.join(NODE_MODULES, packageName);
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return null;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    let licenseName = null;
    if (typeof packageJson.license === 'string') {
        licenseName = packageJson.license;
    } else if (packageJson.license != null) {
        licenseName = packageJson.license.type || null;
    }

    let licenseText = getLicenceFromLocal(packagePath);
    if (licenseText == null) {
        licenseText = '(license text not found)';
    }

    const dependencies = [];
    for (const dependencyName of Object.keys(packageJson.dependencies || {})) {
        const dependency = processPackage(dependencyName, processed);
        if (dependency != null) dependencies.push(dependency);
    }

    return {
        name: packageName,
        licenseName: licenseName,
        licenseText: licenseText,
        url: 'https://www.npmjs.com/package/' + packageName,
        dependencies: dependencies
    };
}

const rootPackageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
const processed = new Set();
const results = [];

for (const packageName of Object.keys(rootPackageJson.dependencies || {})) {
    console.log('processing ' + packageName);
    const result = processPackage(packageName, processed);
    if (result != null) results.push(result);
}

for (const extra of extras) {
    results.push(extra);
}

fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2), 'utf-8');
console.log('done, saved to ' + OUTPUT);
