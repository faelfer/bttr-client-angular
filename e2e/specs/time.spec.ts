import { expect, test } from '@playwright/test';

import skillFactory from '../factories/skillFactory';
import timeFactory from '../factories/timeFactory';
import confirmDeleteScenario from '../scenarios/confirmDeleteScenario';
import timeFormScenario from '../scenarios/timeFormScenario';
import authenticateSession from '../customs/authenticateSession';
import checkHeadingScreen from '../customs/checkHeadingScreen';
import checkRequestBody from '../customs/checkRequestBody';
import deleteResourceApi from '../customs/deleteResourceApi';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await authenticateSession(page);
});

test.describe('Página histórico de tempo', () => {
  test('deve registrar, editar e excluir um tempo', async ({ page, request }) => {
    const timeCreate = timeFactory('create');
    const timeCreateUpdate = timeFactory('create_update');
    const labelEditTime = `Editar registro de ${timeCreate.skill.name}`;

    await page.goto('/times');
    await page.getByRole('link', { name: 'Registrar tempo', exact: true }).click();

    await timeFormScenario(page, {
      minutes: timeCreate.minutes,
      skillName: timeCreate.skill.name,
    });
    await expect(page).toHaveURL('/times');
    await checkRequestBody(
      request,
      { method: 'POST', urlPath: '/times/create_time' },
      { skill_id: timeCreate.skill.id, minutes: timeCreate.minutes },
    );

    // O registro mais recente fica no topo da listagem.
    await page.getByRole('link', { name: labelEditTime, exact: true }).first().click();
    await expect(page.getByLabel('Tempo dedicado em minutos')).toHaveValue(
      String(timeCreate.minutes),
    );

    await timeFormScenario(page, { minutes: timeCreateUpdate.minutes }, true);
    await expect(page).toHaveURL('/times');
    await checkRequestBody(
      request,
      { method: 'PUT', urlPath: `/times/update_time_by_id/${String(timeCreateUpdate.id)}` },
      { skill_id: timeCreateUpdate.skill.id, minutes: timeCreateUpdate.minutes },
    );

    await page.getByRole('link', { name: labelEditTime, exact: true }).first().click();
    await page.getByRole('button', { name: 'Excluir registro', exact: true }).click();
    await confirmDeleteScenario(page);

    await expect(page).toHaveURL('/times');
    await expect(page.getByRole('link', { name: labelEditTime })).toHaveCount(1);
  });

  test('deve mostrar os estados vazios de histórico e de registro', async ({ page, request }) => {
    await deleteResourceApi(request, `/times/delete_time_by_id/${String(timeFactory().id)}`);

    await page.goto('/times');
    await checkHeadingScreen(page, 'Seu tempo conta uma história.');

    // Sem habilidade nao ha o que registrar: o formulario precisa oferecer a
    // criacao em vez de um select vazio.
    await deleteResourceApi(request, `/skills/delete_skill_by_id/${String(skillFactory().id)}`);

    await page.goto('/times/create');
    await checkHeadingScreen(page, 'Primeiro, escolha o que quer aprender.');
  });
});
