import { test, expect } from '@playwright/test';
import { mockApi } from './api-mock';

test('atualiza perfil, valida confirmação e altera senha', async ({ page }) => {
  const state = await mockApi(page, { authenticated: true });
  await page.goto('/profile');
  await expect(page.getByLabel('Nome de usuário')).toHaveValue('Rafael');
  await page.getByLabel('Nome de usuário').fill('Rafael Ferreira');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Conta atualizada com sucesso.')).toBeVisible();
  expect(state.requests.find((item) => item.method === 'PATCH')?.body).toEqual({
    username: 'Rafael Ferreira',
    email: 'rafael@example.com',
  });
  await page.getByRole('link', { name: 'Alterar senha' }).click();
  await page.getByLabel('Senha atual', { exact: true }).fill('Ab1!');
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Diferente123!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByText('As senhas não coincidem.')).toBeVisible();
  expect(state.requests.some((item) => item.path === '/users/redefine_password')).toBe(false);
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page).toHaveURL('/profile');
  expect(state.requests.find((item) => item.path === '/users/redefine_password')?.body).toEqual({
    password: 'Ab1!',
    new_password: 'NovaSenha123!',
  });
});

test('exclui conta somente após confirmação e encerra sessão', async ({ page }) => {
  const state = await mockApi(page, { authenticated: true });
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Excluir minha conta' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Confirmar exclusão' })).toContainText(
    'todos os seus dados',
  );
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(state.requests.some((item) => item.method === 'DELETE')).toBe(false);
  await page.getByRole('button', { name: 'Excluir minha conta' }).click();
  await page.getByRole('button', { name: 'Sim, excluir' }).click();
  await expect(page).toHaveURL('/');
  expect(
    state.requests.some((item) => item.method === 'DELETE' && item.path === '/users/profile'),
  ).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('bttr.token'))).toBeNull();
});
