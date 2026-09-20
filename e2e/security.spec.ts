import { test, expect } from '@playwright/test';
import { MOCK_TOKEN, addResponseStub, authenticate, resetMockApi } from './mock-api';

test.describe('regressões de segurança do cliente', () => {
  test.beforeEach(async ({ request }) => resetMockApi(request));

  test('não aceita redirecionamento externo depois do login', async ({ page }) => {
    await page.goto('/?returnUrl=https://attacker.example/phishing');
    await page.getByLabel('E-mail', { exact: true }).fill('mock.user@bttr.local');
    await page.getByLabel('Senha', { exact: true }).fill('Mock@123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page).toHaveURL('/home');
    expect(new URL(page.url()).origin).toBe('http://127.0.0.1:4200');
  });

  test('escapa conteúdo não confiável devolvido pela API', async ({ page, request }) => {
    const payload = '<img src=x onerror="window.__bttrXss=true">';
    await addResponseStub(request, 'GET', '/skills/skills_by_page', 200, {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 99, name: payload, daily: 30, created: '2026-01-02T10:00:00Z' }],
    });
    await page.addInitScript(() => {
      (window as Window & { __bttrXss?: boolean }).__bttrXss = false;
    });
    await authenticate(page);
    await page.goto('/home');

    await expect(page.getByRole('heading', { name: payload, exact: true })).toBeVisible();
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & { __bttrXss?: boolean }).__bttrXss)).toBe(
      false,
    );
  });

  test('envia o token somente às chamadas da API e não o expõe na página', async ({ page }) => {
    const authorizedRequests: string[] = [];
    page.on('request', (request) => {
      if (request.headers()['authorization']) authorizedRequests.push(request.url());
    });

    await authenticate(page);
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: 'Java', exact: true })).toBeVisible();

    expect(authorizedRequests.length).toBeGreaterThan(0);
    expect(authorizedRequests.every((url) => new URL(url).pathname.startsWith('/api/'))).toBe(true);
    expect(page.url()).not.toContain(MOCK_TOKEN);
    await expect(page.locator('body')).not.toContainText(MOCK_TOKEN);
  });
});
