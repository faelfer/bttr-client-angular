import { test, expect } from '@playwright/test';
import { mockApi } from './api-mock';

test('protege rota, valida login, mantém sessão e permite sair', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/times');
  await expect(page).toHaveURL(/returnUrl/);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
  expect(state.requests).toHaveLength(0);
  await page.getByLabel('E-mail', { exact: true }).fill('rafael@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Ab1!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/times');
  expect(state.requests.find((item) => item.path === '/users/sign_in')?.body).toEqual({
    email: 'rafael@example.com',
    password: 'Ab1!',
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Histórico de tempo', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => localStorage.getItem('bttr.token'))).toBeNull();
});

test('cadastra uma conta e recupera a senha com retorno ao login', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Cadastre-se', exact: true }).click();
  await page.getByLabel('Nome de usuário').fill('Nova pessoa');
  await page.getByLabel('E-mail', { exact: true }).fill('nova@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('SenhaLonga123!');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page).toHaveURL('/');
  expect(state.requests.find((item) => item.path === '/users/sign_up')?.body).toEqual({
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
  await expect(page.getByText('Solicitação realizada com sucesso.').last()).toBeVisible();
  expect(state.requests.find((item) => item.path === '/users/forgot_password')?.body).toEqual({
    email: 'nova@example.com',
  });
  await page.getByRole('link', { name: 'Voltar ao login' }).click();
  await expect(page).toHaveURL('/');
});

test('exibe erro de login sem navegar e permite nova tentativa', async ({ page }) => {
  const state = await mockApi(page);
  state.failNext = '/users/sign_in';
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill('rafael@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Ab1!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Servidor indisponível' })).toBeVisible();
  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/home');
});

test('encerra sessão expirada e apresenta página 404', async ({ page }) => {
  const state = await mockApi(page, { authenticated: true });
  state.unauthorized = true;
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Bom ter você de volta.' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('bttr.token'))).toBeNull();
  await page.goto('/pagina-inexistente');
  await expect(page.getByRole('heading', { name: 'Esse caminho ainda não existe.' })).toBeVisible();
});
