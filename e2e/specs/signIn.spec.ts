import { expect, test } from '@playwright/test';

import userFactory from '../factories/userFactory';
import signInScenario from '../scenarios/signInScenario';
import signOutScenario from '../scenarios/signOutScenario';
import addResponseStub from '../customs/addResponseStub';
import authenticateSession from '../customs/authenticateSession';
import checkErrorBanner from '../customs/checkErrorBanner';
import checkFieldError from '../customs/checkFieldError';
import checkOnHome from '../customs/checkOnHome';
import checkOnSignIn from '../customs/checkOnSignIn';
import checkOnTimes from '../customs/checkOnTimes';
import checkRequestBody from '../customs/checkRequestBody';
import checkSessionCleared from '../customs/checkSessionCleared';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test.describe('Página acesso', () => {
  test('deve proteger a rota privada, realizar acesso e manter a sessão', async ({
    page,
    request,
  }) => {
    await page.goto('/times');
    await expect(page).toHaveURL(/returnUrl/);
    await checkOnSignIn(page);

    // Submeter vazio prova que a validacao do formulario roda antes de a tela
    // chamar a API.
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await checkFieldError(page, 'Informe um e-mail válido.');

    const userDefault = userFactory('default');
    await signInScenario(page, userDefault);

    // O returnUrl da guarda leva de volta para a rota pedida, e nao para /home.
    await expect(page).toHaveURL('/times');
    await checkRequestBody(
      request,
      { method: 'POST', urlPath: '/users/sign_in' },
      { email: userDefault.email, password: userDefault.password },
    );

    // O recarregamento confirma que a sessao sobreviveu no localStorage.
    await page.reload();
    await checkOnTimes(page);

    await signOutScenario(page);
    await expect(page).toHaveURL('/');
    await checkSessionCleared(page);
  });

  test('deve mostrar mensagem de erro ao tentar acesso com credenciais recusadas', async ({
    page,
  }) => {
    await page.goto('/');

    const userDenied = userFactory('denied');
    await signInScenario(page, userDenied);
    await checkErrorBanner(page, 'e-mail ou senha incorretos');
    await expect(page).toHaveURL('/');

    // A recusa nao pode travar a tela: a tentativa seguinte precisa funcionar.
    await signInScenario(page, userFactory('default'));
    await expect(page).toHaveURL('/home');
    await checkOnHome(page);
  });

  test('deve encerrar a sessão quando a API responde 401', async ({ page, request }) => {
    await addResponseStub(
      request,
      { method: 'GET', urlPath: '/users/profile' },
      { status: 401, jsonBody: { message: 'sessão expirada.' } },
    );
    await authenticateSession(page);

    await page.goto('/profile');
    await checkOnSignIn(page);
    await checkSessionCleared(page);
  });
});
