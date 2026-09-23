import { expect, test } from '@playwright/test';

import authenticateSession from '../customs/authenticateSession';
import checkLayoutFits from '../customs/checkLayoutFits';
import resetMockApi from '../customs/resetMockApi';

// Uma rota de cada forma de pagina: listagem, tabela, formulario simples,
// formulario com select e painel de metricas.
const PATHS_AUTHENTICATED = ['/home', '/times', '/profile', '/times/create', '/skills/1/statistic'];

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await authenticateSession(page);
});

test.describe('Layout integrado ao mock', () => {
  test('não deve ultrapassar a tela nem lançar erros de execução', async ({ page }) => {
    const errorsCollected: string[] = [];
    page.on('pageerror', (errorLoop) => errorsCollected.push(errorLoop.message));

    for (const pathLoop of PATHS_AUTHENTICATED) {
      await page.goto(pathLoop);
      await checkLayoutFits(page);
    }

    expect(errorsCollected).toEqual([]);
  });
});
