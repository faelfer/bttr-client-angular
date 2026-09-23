import { expect, test } from '@playwright/test';

import skillFactory from '../factories/skillFactory';
import userFactory from '../factories/userFactory';
import signInScenario from '../scenarios/signInScenario';
import addResponseStub from '../customs/addResponseStub';
import authenticateSession from '../customs/authenticateSession';
import checkHeadingScreen from '../customs/checkHeadingScreen';
import checkOnHome from '../customs/checkOnHome';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test.describe('Regressões de segurança do cliente', () => {
  test('não deve aceitar redirecionamento externo depois do acesso', async ({ page }) => {
    await page.goto('/?returnUrl=https://attacker.example/phishing');
    await signInScenario(page, userFactory('default'));

    // O returnUrl so pode apontar para uma rota interna conhecida.
    await expect(page).toHaveURL('/home');
    await checkOnHome(page);
    expect(new URL(page.url()).origin).toBe('http://127.0.0.1:4200');
  });

  test('deve escapar conteúdo não confiável devolvido pela API', async ({ page, request }) => {
    const payload = '<img src=x onerror="window.__bttrXss=true">';
    const skillDefault = skillFactory();

    await addResponseStub(
      request,
      { method: 'GET', urlPath: '/skills/skills_by_page' },
      {
        status: 200,
        jsonBody: {
          count: 1,
          next: null,
          previous: null,
          results: [{ ...skillDefault, name: payload }],
        },
      },
    );
    await page.addInitScript(() => {
      (window as Window & { __bttrXss?: boolean }).__bttrXss = false;
    });
    await authenticateSession(page);

    await page.goto('/home');
    await checkHeadingScreen(page, payload);
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & { __bttrXss?: boolean }).__bttrXss)).toBe(
      false,
    );
  });

  test('deve enviar o token somente às chamadas da API e não expô-lo na página', async ({
    page,
  }) => {
    const authorizedRequests: string[] = [];
    page.on('request', (requestLoop) => {
      if (requestLoop.headers()['authorization']) authorizedRequests.push(requestLoop.url());
    });

    await authenticateSession(page);
    await page.goto('/home');
    await checkHeadingScreen(page, skillFactory().name);

    const tokenDefault = userFactory('default').token;
    expect(authorizedRequests.length).toBeGreaterThan(0);
    expect(
      authorizedRequests.every((urlLoop) => new URL(urlLoop).pathname.startsWith('/api/')),
    ).toBe(true);
    expect(page.url()).not.toContain(tokenDefault);
    await expect(page.locator('body')).not.toContainText(tokenDefault);
  });
});
