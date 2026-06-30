const path = require('path');
const { merge } = require('webpack-merge');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = merge(defaultConfig, {
  entry: './src/save-as-button.js',
  output: {
    filename: 'my-plugin-script.js',
    path: path.resolve(__dirname, 'build')
  }
});