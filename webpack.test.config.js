// separate file so we can refer to it from webpack.config.js and karma.conf.js
var webpack = require('webpack');
var path = require('path');

module.exports = {
    devtool: 'cheap-inline-source-map',
    resolve: {
        root: __dirname,

        alias: {
            'jquery': 'lib/jquery/dist/jquery'
        },

        modulesDirectories: ['src', 'node_modules']
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/^fetch-mock$/, path.resolve( __dirname, 'node_modules' , 'fetch-mock/client.js'))
    ],

    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                exclude: /node_modules|lib|ci|docs|examples|pages|tools/
            }
        ],
        postLoaders: [{
            test: /src\/.*\.(js$|jsx$)/,
            exclude: /(test|node_modules)\//,
            loader: 'istanbul-instrumenter'
        }]
    }
};
