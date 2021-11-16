const glob = require("glob");
const path = require("path");
const webpack = require("webpack");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");

const generateHTMLPlugins = () =>
  glob.sync("./src/**/*.html").map(
    (dir) =>
      new HTMLWebpackPlugin({
        filename: path.basename(dir), // Output
        template: dir, // Input
      })
  );

const generateHTMLTemplates = () =>
  glob.sync("./src/templates/**/*.html").map(
    (dir) =>
      new HTMLWebpackPlugin({
        filename: path.basename(dir), // Output
        template: dir, // Input
      })
  );

new webpack.DefinePlugin({
  WEBPACK_APP_API_URL: "This is a test default value webpack configs",
});

module.exports = {
  node: {
    fs: "empty",
  },
  entry: ["./src/js/app.js", "./src/style/main.scss"],
  output: {
    path: path.resolve(__dirname, "dist/"),
    filename: "app.bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
      },
      {
        test: /\.html$/,
        loader: "raw-loader",
      },
      {
        test: /\.(pdf|gif|png|jpe?g|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: "static/",
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "fonts/",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: "./src/static/",
        to: "./static/",
      },
    ]),
    ...generateHTMLPlugins(),
    ...generateHTMLTemplates(),
  ],
  stats: {
    colors: true,
  },
  devtool: "source-map",
};
