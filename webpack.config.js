const path = require('path');
const { merge } = require('webpack-merge');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = merge(defaultConfig, {
  entry: './src/index.tsx',
  output: {
    filename: 'my-plugin-script.js',
    path: path.resolve(__dirname, 'build')
  }
});