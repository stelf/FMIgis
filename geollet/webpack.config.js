const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devtool: 'source-map', // Add the devtool option to generate source maps
    devServer: {
        static: [
          path.resolve(__dirname, 'dist'), // Serve files from the 'dist' directory
          path.resolve(__dirname), // Serve 'index.html' from the project root
        ],
        port: 8080,
      },
};

