import { expect, test } from '@playwright/test';

import userFactory from '../factories/userFactory';
import signUpScenario from '../scenarios/signUpScenario';
import checkErrorBanner from '../customs/checkErrorBanner';
import checkHeadingScreen from '../customs/checkHeadingScreen';
import checkRequestBody from '../customs/checkRequestBody';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await page.goto('/');
  await page.getByRole('link', { name: 'Cadastre-se', exact: true }).click();
  await checkHeadingScreen(page, 'Comece sua evolução.');
});

test.describe('Página cadastro', () => {
  test('deve cadastrar uma conta e voltar para a tela de acesso', async ({ page, request }) => {
    const userNew = userFactory();
    await signUpScenario(page, userNew);

    await expect(page).toHaveURL('/');
    await checkRequestBody(
      request,
      { method: 'POST', urlPath: '/users/sign_up' },
      { username: userNew.username, email: userNew.email, password: userNew.password },
    );
  });

  test('deve mostrar mensagem de erro ao cadastrar com e-mail já existente', async ({ page }) => {
    await signUpScenario(page, userFactory('conflict'));

    await checkErrorBanner(page, 'e-mail já cadastrado.');
    await expect(page).toHaveURL('/sign-up');
  });
});
