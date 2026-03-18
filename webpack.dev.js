const { merge } = require('webpack-merge');

const common = require('./webpack.common');

// Use this when developing against a Jellyfin server on another machine (e.g. Pi).
// Avoids CORS: browser talks to same-origin /jellyfin, dev server proxies to the Pi.
const JELLYFIN_SERVER = process.env.JELLYFIN_SERVER || 'http://192.168.68.124:8096';

module.exports = merge(common, {
    // In order for live reload to work we must use "web" as the target not "browserslist"
    target: process.env.WEBPACK_SERVE ? 'web' : 'browserslist',
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                enforce: 'pre',
                use: ['source-map-loader']
            }
        ]
    },
    devServer: {
        port: 8081,
        compress: true,
        client: {
            overlay: {
                errors: true,
                warnings: false
            }
        },
        proxy: [
            {
                context: ['/jellyfin'],
                target: JELLYFIN_SERVER,
                pathRewrite: { '^/jellyfin': '' },
                changeOrigin: true,
                ws: true
            }
        ]
    }
});
