import { expect, test } from '@playwright/test';

import userFactory from '../factories/userFactory';
import redefinePasswordScenario from '../scenarios/redefinePasswordScenario';
import authenticateSession from '../customs/authenticateSession';
import checkRequestBody from '../customs/checkRequestBody';
import checkTextScreen from '../customs/checkTextScreen';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await authenticateSession(page);
  await page.goto('/profile');
  await page.getByRole('link', { name: 'Alterar senha' }).click();
});

test.describe('Página alterar senha', () => {
  test('deve alterar a senha e recusar a confirmação divergente', async ({ page, request }) => {
    const userDefault = userFactory('default');
    const userUpdate = userFactory('update');

    // A divergencia e validada no formulario: a API nao pode ser chamada com
    // uma senha que o usuario nao confirmou.
    await redefinePasswordScenario(page, {
      password: userDefault.password,
      new_password: userUpdate.password,
      confirmation: 'Diferente123!',
    });
    await checkTextScreen(page, 'As senhas não coincidem.');
    await expect(page).toHaveURL('/redefine-password');

    await redefinePasswordScenario(page, {
      password: userDefault.password,
      new_password: userUpdate.password,
    });

    await expect(page).toHaveURL('/profile');
    await checkRequestBody(
      request,
      { method: 'POST', urlPath: '/users/redefine_password' },
      { password: userDefault.password, new_password: userUpdate.password },
    );
  });
});
