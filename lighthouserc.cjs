module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist/bttr/browser',
      isSinglePageApplication: true,
      url: ['http://localhost/', 'http://localhost/sign-up', 'http://localhost/forgot-password'],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance'],
        chromeFlags: '--no-sandbox',
        // The shared Jenkins host benchmarks as a high-end/mid-tier mobile CPU.
        // Lighthouse's default 4x multiplier assumes a high-end desktop and
        // over-throttles this runner, so use its documented 2x calibration.
        throttling: { cpuSlowdownMultiplier: 2 },
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
