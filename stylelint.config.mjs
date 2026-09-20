/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    '.angular/**',
    'coverage/**',
    'lighthouse-report/**',
    'playwright-report/**',
    'security-reports/**',
    'test-results/**',
  ],
  rules: {
    // Component-oriented styles legitimately group unrelated selectors by feature.
    'no-descending-specificity': null,
  },
};
