const { createCjsPreset } = require('jest-preset-angular/presets');
module.exports = {
  ...createCjsPreset({ tsconfig: '<rootDir>/tsconfig.spec.json' }),
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  collectCoverageFrom: ['src/app/**/*.ts', '!src/app/**/*.spec.ts'],
  coverageDirectory: 'coverage',
  // Piso fixado no patamar atual: impede regressão sem travar o build de hoje.
  // Suba junto com cada nova suíte; o Playwright não instrumenta cobertura.
  coverageThreshold: {
    global: { statements: 34, branches: 41, functions: 34, lines: 36 },
  },
};
