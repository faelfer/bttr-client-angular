import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e/specs',
  /* Confere se o mock do bttr-server respondeu antes de a suíte começar, para
     que uma falha de ambiente não vire uma falha por arquivo de teste.
     Ver e2e/setup/prepareMockApi.ts. */
  globalSetup: './e2e/setup/prepareMockApi.ts',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  /* Interrompe a suíte na primeira falha inesperada. Teste ignorado não entra
     nessa conta: quem trata skip é o reporter fail-fast, que resume os motivos
     no final e reprova a execução quando um pré requisito não foi atendido. */
  maxFailures: 1,
  /* O fail-fast carrega o veredito real (pré requisito não atendido e teste que
     não rodou reprovam a execução) e grava test-results/fail-fast-summary.json
     ao lado dos artefatos. Ver e2e/reporters/failFastReporter.ts. */
  reporter: process.env['CI']
    ? [
        ['./e2e/reporters/failFastReporter.ts'],
        ['list'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
      ]
    : [['./e2e/reporters/failFastReporter.ts'], ['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm start -- --host 127.0.0.1 --proxy-config proxy.e2e.conf.cjs',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
