module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist/bttr/browser',
      isSinglePageApplication: true,
      url: ['http://localhost/', 'http://localhost/sign-up', 'http://localhost/forgot-password'],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance', 'accessibility'],
        chromeFlags: '--no-sandbox',
        // Calibração de CPU. O multiplicador padrão (4x) assume um desktop de topo
        // e sobre-estrangula este agente. `npm run test:lighthouse:ci` registra o
        // benchmarkIndex real ao final de cada execução: revalide este valor sempre
        // que a mediana registrada mudar de patamar. Em um agente com mediana
        // ~2980 o gate passa também em 4x, e em 4x o orçamento de TBT volta a ter
        // poder de detecção — prefira o padrão quando o agente comportar.
        throttling: { cpuSlowdownMultiplier: 2 },
      },
    },
    assert: {
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 1 }],
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
