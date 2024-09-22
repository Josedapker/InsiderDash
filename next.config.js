const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/dexscreener/:path*',
        destination: 'http://localhost:3001/api/dexscreener/:path*',
      },
    ];
  },
};
