import { test, expect } from '@playwright/test';
import {
  AUTHORIZATION,
  addResponseStub,
  authenticate,
  expectRequestBody,
  removeResponseStub,
  resetMockApi,
} from './mock-api';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await authenticate(page);
});

test('cria, edita e exclui habilidade no cenário mantido pelo WireMock', async ({
  page,
  request,
}) => {
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: 'Java', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Nova habilidade', exact: true }).click();
  await page.getByLabel('Nome da habilidade').fill('Kotlin');
  await page.getByLabel('Meta diária em minutos').fill('0');
  await page.getByRole('button', { name: 'Criar habilidade', exact: true }).click();
  await expect(page.getByText('Informe minutos inteiros entre 1 e 1440.')).toBeVisible();
  await page.getByLabel('Meta diária em minutos').fill('60');
  await page.getByRole('button', { name: 'Criar habilidade', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kotlin', exact: true })).toBeVisible();
  await expectRequestBody(request, 'POST', '/skills/create_skill', { name: 'Kotlin', daily: 60 });

  await page.getByRole('link', { name: 'Editar Kotlin', exact: true }).click();
  await page.getByLabel('Nome da habilidade').fill('Quarkus');
  await page.getByLabel('Meta diária em minutos').fill('90');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('heading', { name: 'Quarkus', exact: true })).toBeVisible();
  await expectRequestBody(request, 'PUT', '/skills/update_skill_by_id/2', {
    name: 'Quarkus',
    daily: 90,
  });

  await page.getByRole('link', { name: 'Editar Quarkus', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir habilidade', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL('/skills/2/update');
  await page.getByRole('button', { name: 'Excluir habilidade', exact: true }).click();
  await page.getByRole('button', { name: 'Sim, excluir' }).click();
  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('heading', { name: 'Java', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quarkus', exact: true })).toHaveCount(0);
});

test('consulta estatísticas e cria, edita e exclui tempo no cenário do WireMock', async ({
  page,
  request,
}) => {
  await page.goto('/home');
  await page
    .locator('.skill-card')
    .filter({ has: page.getByRole('heading', { name: 'Java', exact: true }) })
    .getByRole('link', { name: 'Ver estatísticas' })
    .click();
  await expect(page.getByRole('heading', { name: 'Sua evolução neste mês' })).toBeVisible();

  await page.getByRole('link', { name: 'Registrar tempo', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Habilidade', exact: true })).toContainText(
    'Java',
  );
  await page.getByLabel('Tempo dedicado em minutos').fill('60');
  await page.getByRole('button', { name: 'Registrar tempo', exact: true }).click();
  await expect(page).toHaveURL('/times');
  await expectRequestBody(request, 'POST', '/times/create_time', { skill_id: 1, minutes: 60 });

  await page.getByRole('link', { name: 'Editar registro de Java', exact: true }).first().click();
  await expect(page.getByLabel('Tempo dedicado em minutos')).toHaveValue('60');
  await page.getByLabel('Tempo dedicado em minutos').fill('90');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page).toHaveURL('/times');
  await expectRequestBody(request, 'PUT', '/times/update_time_by_id/2', {
    skill_id: 1,
    minutes: 90,
  });

  await page.getByRole('link', { name: 'Editar registro de Java', exact: true }).first().click();
  await page.getByRole('button', { name: 'Excluir registro', exact: true }).click();
  await page.getByRole('button', { name: 'Sim, excluir' }).click();
  await expect(page).toHaveURL('/times');
  await expect(page.getByRole('link', { name: 'Editar registro de Java' })).toHaveCount(1);
});

test('mostra estados vazios devolvidos pelo mock do backend', async ({ page, request }) => {
  const deleteSkill = await request.delete('/api/skills/delete_skill_by_id/1', {
    headers: AUTHORIZATION,
  });
  const deleteTime = await request.delete('/api/times/delete_time_by_id/1', {
    headers: AUTHORIZATION,
  });
  expect(deleteSkill.ok()).toBe(true);
  expect(deleteTime.ok()).toBe(true);

  await page.goto('/home');
  await expect(
    page.getByRole('heading', { name: 'Sua próxima habilidade começa aqui.' }),
  ).toBeVisible();
  await page.goto('/times');
  await expect(page.getByRole('heading', { name: 'Seu tempo conta uma história.' })).toBeVisible();
  await page.goto('/times/create');
  await expect(
    page.getByRole('heading', { name: 'Primeiro, escolha o que quer aprender.' }),
  ).toBeVisible();
});

test('recupera erro temporário configurado no WireMock e trata recurso inexistente', async ({
  page,
  request,
}) => {
  const mappingId = await addResponseStub(request, 'GET', '/skills/skills_by_page', 503, {
    message: 'Servidor indisponível. Tente novamente.',
  });
  await page.goto('/home');
  await expect(page.getByText('Servidor indisponível. Tente novamente.')).toBeVisible();
  await removeResponseStub(request, mappingId);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Java', exact: true })).toBeVisible();

  await page.goto('/skills/999/update');
  await expect(page.getByText('habilidade não encontrada.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);
});

test('layout integrado ao mock não ultrapassa a tela nem lança erros', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
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
