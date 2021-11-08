const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.config.common.js");

const fs = require("fs");

const rawdata = fs.readFileSync("./env.development.json");
const env = JSON.parse(rawdata);

module.exports = merge(common, {
  mode: "development",
  devServer: {
    contentBase: "src",
    watchContentBase: true,
    hot: true,
    open: true,
    port: process.env.PORT || 9000,
    host: process.env.HOST || "localhost",
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify({
        NODE_ENV: "development",
        ...env,
      }),
    }),
  ],
});
