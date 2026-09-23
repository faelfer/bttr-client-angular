import { test } from '@playwright/test';

import checkHeadingScreen from '../customs/checkHeadingScreen';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test.describe('Página não encontrada', () => {
  test('deve apresentar a página 404 em uma rota inexistente', async ({ page }) => {
    await page.goto('/pagina-inexistente');
    await checkHeadingScreen(page, 'Esse caminho ainda não existe.');
  });
});
