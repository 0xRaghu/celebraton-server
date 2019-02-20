module.exports = {
  webpack: config => {
    // Fixes npm packages that depend on `fs` module
    config.node = {
      fs: "empty"
    };

    return config;
  }
};
// next.config.js
const withCSS = require("@zeit/next-css");
module.exports = withCSS({
  /* my next config */
});
