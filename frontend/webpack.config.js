const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const srcPath = './src';
const node_modules = "./node_modules";

module.exports = GenerateConfig();

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
                        {loader: 'css-loader', options: {importLoaders: 1}},
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
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

    return entryPoints;
}
