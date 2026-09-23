import { expect, test } from '@playwright/test';

import skillFactory from '../factories/skillFactory';
import authenticateSession from '../customs/authenticateSession';
import checkHeadingScreen from '../customs/checkHeadingScreen';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await authenticateSession(page);
});

test.describe('Página estatísticas', () => {
  test('deve abrir as estatísticas da habilidade e levar o registro já selecionado', async ({
    page,
  }) => {
    const skillDefault = skillFactory();

    await page.goto('/home');
    await page
      .locator('.skill-card')
      .filter({ has: page.getByRole('heading', { name: skillDefault.name, exact: true }) })
      .getByRole('link', { name: 'Ver estatísticas' })
      .click();

    await checkHeadingScreen(page, skillDefault.name);
    await checkHeadingScreen(page, 'Sua evolução neste mês');

    // O atalho da tela de estatisticas leva o skillId na query string; o
    // formulario precisa chegar com a habilidade ja escolhida.
    await page.getByRole('link', { name: 'Registrar tempo', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Habilidade', exact: true })).toContainText(
      skillDefault.name,
    );
  });
});
