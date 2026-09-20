import { test, expect } from '@playwright/test';
import { authenticate, expectRequestBody, resetMockApi } from './mock-api';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await authenticate(page);
});

test('consulta e atualiza perfil e altera senha usando o mock do backend', async ({
  page,
  request,
}) => {
  await page.goto('/profile');
  await expect(page.getByLabel('Nome de usuário')).toHaveValue('mock.user');
  await expect(page.getByLabel('E-mail')).toHaveValue('mock.user@bttr.local');
  await page.getByLabel('Nome de usuário').fill('Mock User');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('perfil alterado com sucesso.')).toBeVisible();
  await expectRequestBody(request, 'PATCH', '/users/profile', {
    username: 'Mock User',
    email: 'mock.user@bttr.local',
  });

  await page.getByRole('link', { name: 'Alterar senha' }).click();
  await page.getByLabel('Senha atual', { exact: true }).fill('Mock@123');
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Diferente123!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByText('As senhas não coincidem.')).toBeVisible();
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page).toHaveURL('/profile');
  await expectRequestBody(request, 'POST', '/users/redefine_password', {
    password: 'Mock@123',
    new_password: 'NovaSenha123!',
  });
});

test('exclui conta somente após confirmação e encerra a sessão', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Excluir minha conta' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Confirmar exclusão' })).toContainText(
    'todos os seus dados',
  );
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL('/profile');

  await page.getByRole('button', { name: 'Excluir minha conta' }).click();
  await page.getByRole('button', { name: 'Sim, excluir' }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => localStorage.getItem('bttr.token'))).toBeNull();
});
