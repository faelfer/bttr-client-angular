module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist/bttr/browser',
      isSinglePageApplication: true,
      url: ['http://localhost/', 'http://localhost/sign-up', 'http://localhost/forgot-password'],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance'],
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-report',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
  },
};
