const webpack = require('webpack');
const config = require('../webpack.config.js');
var socket = require('socket.io');
var http = require('http');
const compiler = webpack(config);
function server() {
    // this is intentionally nothing because we only need ws
}
app = http.createServer(server);
io = socket(app, {
    cors: {
        origin: '*',
    },
});
app.listen(35569);
const watchOptions = {
    aggregateTimeout: 300,
    ignored: /node_modules/,
};
compiler.hooks.watchRun.tap('CssHmrNotify', () => {
    io.emit('css_reloading');
});
compiler.watch(watchOptions, (err, stats) => {
    if (err) {
        io.emit('compile_error', err.stack || String(err));
        console.error(err.stack || err);
        if (err.details) console.error(err.details);
        return;
    }
    if (!stats) return;

    const info = stats.toJson({ preset: 'errors-warnings' });

    if (stats.hasErrors()) {
        io.emit('compile_error', info.errors.map((e) => e.message).join('\n'));
        console.error(info.errors.map((e) => e.message).join('\n'));
        return;
    }
    if (stats.hasWarnings()) {
        console.warn(info.warnings.map((w) => w.message).join('\n'));
    }

    console.log(stats.toString({ colors: true, preset: 'normal' }));

    let emitted = [...stats.compilation.emittedAssets];
    let cssChanged = emitted.some((f) => f.endsWith('.css'));
    let jsChanged = emitted.some((f) => f.endsWith('.js'));

    if (cssChanged) io.emit('css_reload');
    if (jsChanged) io.emit('js_reload');
});