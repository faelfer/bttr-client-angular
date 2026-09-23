import { test } from '@playwright/test';

import userFactory from '../factories/userFactory';
import forgotPasswordScenario from '../scenarios/forgotPasswordScenario';
import checkRequestBody from '../customs/checkRequestBody';
import checkSuccessToast from '../customs/checkSuccessToast';
import checkTextScreen from '../customs/checkTextScreen';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await page.goto('/');
  await page.getByRole('link', { name: 'Esqueceu a senha?' }).click();
});

test.describe('Página recuperar senha', () => {
  test('deve solicitar o link de recuperação de senha', async ({ page, request }) => {
    await checkTextScreen(page, 'Enviaremos um link para redefinir sua senha por e-mail.');

    const userDefault = userFactory('default');
    await forgotPasswordScenario(page, userDefault);

    // A resposta e sempre a mesma, exista ou nao o e-mail: e o que evita que a
    // tela vire um verificador de cadastro.
    await checkSuccessToast(page, 'enviaremos as instruções');
    await checkRequestBody(
      request,
      { method: 'POST', urlPath: '/users/forgot_password' },
      { email: userDefault.email },
    );
  });
});
