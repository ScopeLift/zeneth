module.exports = {
  future: {
    webpack5: true,
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(new webpack.IgnorePlugin(/^electron$/));
    return config;
  },
};
