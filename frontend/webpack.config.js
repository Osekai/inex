const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const srcPath = './src';
const node_modules = "./node_modules";

module.exports = GenerateConfig();

// turns 1000bpx into calc(1000 * 100vw / <theme width>) for profiles dyn themes
function bpxPlugin() {
    const themesPath = path.resolve(srcPath, '../../frontend/profiles-banners/');
    const widthCache = {};

    return {
        postcssPlugin: 'bpx',
        Declaration(decl, { result }) {
            if (!decl.value.includes('bpx')) return;

            const file = decl.source && decl.source.input.file;
            if (!file) return;

            const relative = path.relative(themesPath, file);
            if (relative.startsWith('..')) {
                throw decl.error('bpx used outside of a profiles dyn theme');
            }

            const folder = relative.split(path.sep)[0];
            const metaPath = path.resolve(themesPath, folder, 'meta.json');

            // so changing meta.json triggers a rebuild
            result.messages.push({ type: 'dependency', plugin: 'bpx', file: metaPath });

            if (widthCache[folder] === undefined) {
                if (!fs.existsSync(metaPath)) {
                    throw decl.error('no meta.json found for theme ' + folder);
                }
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                widthCache[folder] = meta.resolution[0];
            }

            const width = widthCache[folder];
            decl.value = decl.value.replace(/(-?\d*\.?\d+)bpx\b/g, (match, number) => {
                return 'calc(' + number + ' * 100vw / ' + width + ')';
            });
        }
    };
}

function GenerateConfig() {
    const isProduction = process.env["ANTHERA_PRODUCTION"] === "true";

    const config = {
        mode: isProduction ? 'production' : 'development',
        entry: getEntryPoints(),
        cache: {
            type: 'filesystem', // Enables persistent caching
        },
        devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true, // Cleans up old files automatically
        },
        resolve: {
            extensions: [".js", ".json"], // No need for .ts or .tsx anymore
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: 'babel-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {loader: 'css-loader', options: {importLoaders: 1,

                                url: {
                                    filter: (url) => !url.startsWith('/')
                                }
                            }},
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        bpxPlugin(),
                                        require('postcss-custom-media')({
                                            customMedia: {
                                                '--mobile': '(min-width: 601px)',
                                                '--desktop': '(max-width: 600px)',
                                            }
                                        })
                                    ]
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
                    type: 'asset/resource',
                },
                {
                    include: path.resolve(__dirname, "node_modules/lucide"),
                    sideEffects: false
                },
            ]
        },
        optimization: isProduction ? {
            nodeEnv: 'production',
            flagIncludedChunks: true,
            usedExports: true,
            concatenateModules: true,
            noEmitOnErrors: true,
            minimize: true,
            removeAvailableModules: true,
            removeEmptyChunks: true,
            mergeDuplicateChunks: true,
            splitChunks: {
                cacheGroups: {
                    common: {
                        name: 'common',
                        chunks: 'all',
                        minChunks: 2, // Extract modules shared across at least 2 chunks
                        test: /[\\/]node_modules[\\/](purify.js)[\\/]/, // Only extract purify.js here
                        enforce: true,
                    }
                }
            }
        } : undefined,

        plugins: [
            new MiniCssExtractPlugin(),
            {
                apply: (compiler) => {
                    compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
                        const revFile = 'rev.txt';
                        let currentRevision = fs.existsSync(revFile) ? parseInt(fs.readFileSync(revFile)) || 0 : 0;
                        fs.writeFileSync(revFile, (currentRevision + 1).toString());
                    });
                }
            }
        ]
    };

    if (!isProduction) {
        console.log("\x1b[41mCompiling in Development Mode\x1b[0m");
        //config.plugins.push(new BundleAnalyzerPlugin()); // Disabled by default for faster dev builds
    }

    return config;
}

function getEntryPoints() {
    const entryPoints = {};

    // Read entry point from /src/index.js
    entryPoints['index'] = path.resolve(srcPath, 'index.js');
    entryPoints['404'] = path.resolve(srcPath, '404.js');

    // Read all .js files in the /src/views directory
    var viewsPath = path.resolve(srcPath, 'js/views');
    if (fs.existsSync(viewsPath)) {
        const viewFiles = fs.readdirSync(viewsPath);
        viewFiles.forEach((file) => {
            if (file.endsWith('.js')) {
                const distName = path.basename(file).replace(".js", "");
                entryPoints[distName] = path.resolve(viewsPath, file);
            }
        });
    }

    var profilesDynThemes = path.resolve(srcPath, '../../frontend/profiles-banners/');
    console.log(profilesDynThemes);
    if (fs.existsSync(profilesDynThemes)) {
        for(let folder of fs.readdirSync(profilesDynThemes)) {
            console.log(folder);
            if(folder.startsWith('.')) continue;
            let jsPath = path.resolve(profilesDynThemes, folder, folder + '.js');
            if(!fs.existsSync(jsPath)) continue;
            console.log(jsPath);

            entryPoints["pb-" + folder] = jsPath;
        }
    }

    return entryPoints;
}
