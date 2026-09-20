import { test, expect } from '@playwright/test';
import { addResponseStub, authenticate, expectRequestBody, resetMockApi } from './mock-api';

test.beforeEach(async ({ request }) => resetMockApi(request));

test('protege rota, autentica no mock do backend, mantém sessão e permite sair', async ({
  page,
  request,
}) => {
  await page.goto('/times');
  await expect(page).toHaveURL(/returnUrl/);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();

  await page.getByLabel('E-mail', { exact: true }).fill('mock.user@bttr.local');
  await page.getByLabel('Senha', { exact: true }).fill('Mock@123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/times');
  await expectRequestBody(request, 'POST', '/users/sign_in', {
    email: 'mock.user@bttr.local',
    password: 'Mock@123',
  });

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Histórico de tempo', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => localStorage.getItem('bttr.token'))).toBeNull();
});

test('cadastra uma conta e solicita recuperação de senha no mock do backend', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cadastre-se', exact: true }).click();
  await page.getByLabel('Nome de usuário').fill('Nova pessoa');
  await page.getByLabel('E-mail', { exact: true }).fill('nova@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('SenhaLonga123!');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page).toHaveURL('/');
  await expectRequestBody(request, 'POST', '/users/sign_up', {
    username: 'Nova pessoa',
    email: 'nova@example.com',
    password: 'SenhaLonga123!',
  });

  await page.getByRole('link', { name: 'Esqueceu a senha?' }).click();
  await expect(
    page.getByText('Enviaremos um link para redefinir sua senha por e-mail.'),
  ).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill('nova@example.com');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByText(/enviaremos as instruções/)).toBeVisible();
  await expectRequestBody(request, 'POST', '/users/forgot_password', {
    email: 'nova@example.com',
  });
});

test('exibe a recusa de login do mock e permite nova tentativa', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill('invalid@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('invalid');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'e-mail ou senha incorretos' }),
  ).toBeVisible();
  await expect(page).toHaveURL('/');

  await page.getByLabel('E-mail', { exact: true }).fill('mock.user@bttr.local');
  await page.getByLabel('Senha', { exact: true }).fill('Mock@123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/home');
});

test('encerra sessão após 401 devolvido pelo WireMock e apresenta página 404', async ({
  page,
  request,
}) => {
  await addResponseStub(request, 'GET', '/users/profile', 401, { message: 'sessão expirada.' });
  await authenticate(page);
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Bom ter você de volta.' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('bttr.token'))).toBeNull();

  await page.goto('/pagina-inexistente');
  await expect(page.getByRole('heading', { name: 'Esse caminho ainda não existe.' })).toBeVisible();
});
