const { config } = require('dotenv');
config('./.env');

module.exports = {
  env: {
    INFURA_ID: process.env.INFURA_ID,
    AUTH_PRIVATE_KEY: process.env.AUTH_PRIVATE_KEY,
  },
  future: {
    webpack5: true,
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(new webpack.IgnorePlugin(/^electron$/));
    return config;
  },
};
