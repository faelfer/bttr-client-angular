import { expect, test } from '@playwright/test';

import userFactory from '../factories/userFactory';
import confirmDeleteScenario from '../scenarios/confirmDeleteScenario';
import profileScenario from '../scenarios/profileScenario';
import authenticateSession from '../customs/authenticateSession';
import checkRequestBody from '../customs/checkRequestBody';
import checkSessionCleared from '../customs/checkSessionCleared';
import checkSuccessToast from '../customs/checkSuccessToast';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await authenticateSession(page);
  await page.goto('/profile');
});

test.describe('Página perfil', () => {
  test('deve carregar e alterar os dados do perfil', async ({ page, request }) => {
    const userDefault = userFactory('default');
    await expect(page.getByLabel('Nome de usuário')).toHaveValue(userDefault.username);
    await expect(page.getByLabel('E-mail')).toHaveValue(userDefault.email);

    const userUpdate = userFactory('update');
    await profileScenario(page, { username: userUpdate.username });

    await checkSuccessToast(page, 'perfil alterado com sucesso.');
    await checkRequestBody(
      request,
      { method: 'PATCH', urlPath: '/users/profile' },
      { username: userUpdate.username, email: userUpdate.email },
    );
  });

  test('deve excluir a conta somente após a confirmação e encerrar a sessão', async ({ page }) => {
    await page.getByRole('button', { name: 'Excluir minha conta' }).click();
    await expect(page.getByRole('alertdialog', { name: 'Confirmar exclusão' })).toContainText(
      'todos os seus dados',
    );

    // Cancelar precisa deixar a conta intacta: e a unica protecao contra um
    // clique acidental em uma acao irreversivel.
    await confirmDeleteScenario(page, false);
    await expect(page).toHaveURL('/profile');

    await page.getByRole('button', { name: 'Excluir minha conta' }).click();
    await confirmDeleteScenario(page);

    await expect(page).toHaveURL('/');
    await checkSessionCleared(page);
  });
});
