const glob = require('glob'); // Import glob correctly
const fs = require('fs-extra');
const path = require('path');

// Function to rename .css to .scss files
function renameCssToScss() {
    glob("src/**/*.css", { nodir: true }, (err, files) => {  // Ensure the glob pattern is correct
        if (err) {
            console.error("Error finding .css files:", err);
            return;
        }

        files.forEach(file => {
            const newFilePath = file.replace('.css', '.scss');
            
            // Rename the file
            fs.rename(file, newFilePath, (err) => {
                if (err) {
                    console.error(`Error renaming ${file} to ${newFilePath}:`, err);
                    return;
                }
                console.log(`Renamed ${file} to ${newFilePath}`);

                // Update import statements in JS/TS/HTML files
                updateImports(file, newFilePath);
            });
        });
    });
}

// Function to update import statements
function updateImports(oldFile, newFile) {
    const extension = path.extname(oldFile);
    
    glob("src/**/*.{js,ts,jsx,tsx,html}", (err, files) => {
        if (err) {
            console.error("Error finding JS/TS/HTML files:", err);
            return;
        }

        files.forEach(file => {
            fs.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading ${file}:`, err);
                    return;
                }

                // Update import paths in the file
                const updatedData = data.replace(
                    new RegExp(`['"](${oldFile.replace('src/', '').replace(/\\/g, '/').replace('.css', '')})['"]`, 'g'),
                    `'${newFile.replace('src/', '').replace(/\\/g, '/').replace('.scss', '')}'`
                );

                // If there's an update, write the changes back to the file
                if (updatedData !== data) {
                    fs.writeFile(file, updatedData, 'utf8', (err) => {
                        if (err) {
                            console.error(`Error updating imports in ${file}:`, err);
                            return;
                        }
                        console.log(`Updated import in ${file}`);
                    });
                }
            });
        });
    });
}

// Run the script
renameCssToScss();

