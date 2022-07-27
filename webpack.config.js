const path = require('path');

module.exports = {
  entry: './src/index.ts',
  devtool: 'source-map',
  mode: 'production',
  watch: true,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'Bind',
      type: 'umd',
      export: 'default',
    },
  },
};
