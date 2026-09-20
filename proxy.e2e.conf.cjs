const target = process.env.BTTR_MOCK_API_URL || 'http://127.0.0.1:8090';

module.exports = {
  '/api/**': {
    target,
    secure: false,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  },
};
