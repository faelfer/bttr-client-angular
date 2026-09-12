import { test, expect } from '@playwright/test';
import { mockApi } from './api-mock';

test('cria, edita e exclui habilidade com confirmação e paginação', async ({ page }) => {
  const state = await mockApi(page, { authenticated: true });
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: 'Inglês', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Página 2', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fotografia', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Nova habilidade', exact: true }).click();
  await page.getByLabel('Nome da habilidade').fill('Angular');
  await page.getByLabel('Meta diária em minutos').fill('0');
  await page.getByRole('button', { name: 'Criar habilidade', exact: true }).click();
  await expect(page.getByText('Informe minutos inteiros entre 1 e 1440.')).toBeVisible();
  await page.getByLabel('Meta diária em minutos').fill('45');
  await page.getByRole('button', { name: 'Criar habilidade', exact: true }).click();
  await expect(page).toHaveURL('/home');
  expect(state.requests.find((item) => item.path === '/skills/create_skill')?.body).toEqual({
    name: 'Angular',
    daily: 45,
  });
  await page.getByRole('link', { name: 'Editar Angular', exact: true }).click();
  await expect(page.getByLabel('Nome da habilidade')).toHaveValue('Angular');
  await page.getByLabel('Nome da habilidade').fill('Angular avançado');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('heading', { name: 'Angular avançado', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Editar Angular avançado' }).click();
  await page.getByRole('button', { name: 'Excluir habilidade', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(state.requests.some((item) => item.method === 'DELETE')).toBe(false);
  await page.getByRole('button', { name: 'Excluir habilidade', exact: true }).click();
  await page.getByRole('button', { name: 'Sim, excluir' }).click();
  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('heading', { name: 'Angular avançado', exact: true })).toHaveCount(0);
});

test('consulta estatísticas e cria, edita e exclui tempo', async ({ page }) => {
  const state = await mockApi(page, { authenticated: true });
  await page.goto('/home');
  await page
    .locator('.skill-card')
    .filter({ has: page.getByRole('heading', { name: 'Inglês', exact: true }) })
    .getByRole('link', { name: 'Ver estatísticas' })
    .click();
  await expect(page.getByRole('heading', { name: 'Sua evolução neste mês' })).toBeVisible();
  const query = state.requests.find((item) => item.path === '/times/times_by_date')!.query;
  expect(query.get('skill_id')).toBe('1');
  expect(new Date(query.get('date_final')!).getMilliseconds()).toBe(999);
  await page.getByRole('link', { name: 'Registrar tempo', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Habilidade', exact: true })).toContainText(
    'Inglês',
  );
  await page.getByLabel('Tempo dedicado em minutos').fill('60');
  await page.getByRole('button', { name: 'Registrar tempo', exact: true }).click();
  await expect(page).toHaveURL('/times');
  expect(state.requests.find((item) => item.path === '/times/create_time')?.body).toEqual({
    skill_id: 1,
    minutes: 60,
  });
  await page.getByRole('link', { name: 'Editar registro de Inglês', exact: true }).first().click();
  await expect(page.getByLabel('Tempo dedicado em minutos')).toHaveValue('60');
  await page.getByRole('combobox', { name: 'Habilidade', exact: true }).click();
  await page.getByRole('option', { name: 'Programação', exact: true }).click();
  await page.getByLabel('Tempo dedicado em minutos').fill('75');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page).toHaveURL('/times');
  expect(state.requests.find((item) => item.path === '/times/update_time_by_id/99')?.body).toEqual({
    skill_id: 2,
    minutes: 75,
  });
  await page
    .getByRole('link', { name: 'Editar registro de Programação', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Excluir registro', exact: true }).click();
  await page.getByRole('button', { name: 'Sim, excluir' }).click();
  await expect(page).toHaveURL('/times');
  expect(state.times.find((item) => item.id === 99)).toBeUndefined();
  await page.getByRole('button', { name: 'Página 2', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Fotografia', exact: true })).toBeVisible();
});

test('mostra estados vazios e orienta criação antes de registrar tempo', async ({ page }) => {
  await mockApi(page, { authenticated: true, empty: true });
  await page.goto('/home');
  await expect(
    page.getByRole('heading', { name: 'Sua próxima habilidade começa aqui.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Histórico de tempo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu tempo conta uma história.' })).toBeVisible();
  await page.getByRole('link', { name: 'Registrar tempo', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Primeiro, escolha o que quer aprender.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Criar habilidade', exact: true }).click();
  await expect(page).toHaveURL('/skills/create');
});

test('recupera erro de listagem e impede edição de recurso inexistente', async ({ page }) => {
  const state = await mockApi(page, { authenticated: true });
  state.failNext = '/skills/skills_by_page';
  await page.goto('/home');
  await expect(page.getByText('Servidor indisponível. Tente novamente.')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Inglês', exact: true })).toBeVisible();
  await page.goto('/skills/999/update');
  await expect(page.getByText('Habilidade não encontrada.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);
});

test('layout não ultrapassa a largura da tela e não lança erros', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockApi(page, { authenticated: true });
  for (const path of ['/home', '/times', '/profile', '/times/create', '/skills/1/statistic']) {
    await page.goto(path);
    await expect(page.locator('app-status .loading')).toHaveCount(0);
    await expect(page.locator('main h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
