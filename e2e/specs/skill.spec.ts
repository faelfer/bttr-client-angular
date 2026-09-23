import { expect, test } from '@playwright/test';

import skillFactory from '../factories/skillFactory';
import confirmDeleteScenario from '../scenarios/confirmDeleteScenario';
import skillFormScenario from '../scenarios/skillFormScenario';
import addResponseStub from '../customs/addResponseStub';
import authenticateSession from '../customs/authenticateSession';
import checkErrorBanner from '../customs/checkErrorBanner';
import checkFieldError from '../customs/checkFieldError';
import checkHeadingScreen from '../customs/checkHeadingScreen';
import checkRequestBody from '../customs/checkRequestBody';
import deleteResourceApi from '../customs/deleteResourceApi';
import removeResponseStub from '../customs/removeResponseStub';
import resetMockApi from '../customs/resetMockApi';

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await authenticateSession(page);
});

test.describe('Página habilidades', () => {
  test('deve criar, editar e excluir uma habilidade', async ({ page, request }) => {
    const skillDefault = skillFactory();
    const skillCreate = skillFactory('create');
    const skillCreateUpdate = skillFactory('create_update');

    await page.goto('/home');
    await checkHeadingScreen(page, skillDefault.name);

    await page.getByRole('link', { name: 'Nova habilidade', exact: true }).click();

    // Zero minutos prova que a validacao de meta roda antes do envio.
    await skillFormScenario(page, { name: skillCreate.name, daily: 0 });
    await checkFieldError(page, 'Informe minutos inteiros entre 1 e 1440.');

    await skillFormScenario(page, skillCreate);
    await checkHeadingScreen(page, skillCreate.name);
    await checkRequestBody(
      request,
      { method: 'POST', urlPath: '/skills/create_skill' },
      { name: skillCreate.name, daily: skillCreate.daily },
    );

    await page.getByRole('link', { name: `Editar ${skillCreate.name}`, exact: true }).click();
    await skillFormScenario(page, skillCreateUpdate, true);
    await checkHeadingScreen(page, skillCreateUpdate.name);
    await checkRequestBody(
      request,
      { method: 'PUT', urlPath: `/skills/update_skill_by_id/${String(skillCreateUpdate.id)}` },
      { name: skillCreateUpdate.name, daily: skillCreateUpdate.daily },
    );

    await page.getByRole('link', { name: `Editar ${skillCreateUpdate.name}`, exact: true }).click();
    await page.getByRole('button', { name: 'Excluir habilidade', exact: true }).click();
    await confirmDeleteScenario(page, false);
    await expect(page).toHaveURL(`/skills/${String(skillCreateUpdate.id)}/update`);

    await page.getByRole('button', { name: 'Excluir habilidade', exact: true }).click();
    await confirmDeleteScenario(page);
    await expect(page).toHaveURL('/home');
    await checkHeadingScreen(page, skillDefault.name);
    await expect(
      page.getByRole('heading', { name: skillCreateUpdate.name, exact: true }),
    ).toHaveCount(0);
  });

  test('deve recuperar erro temporário da listagem e tratar habilidade inexistente', async ({
    page,
    request,
  }) => {
    const mappingId = await addResponseStub(
      request,
      { method: 'GET', urlPath: '/skills/skills_by_page' },
      { status: 503, jsonBody: { message: 'Servidor indisponível. Tente novamente.' } },
    );

    await page.goto('/home');
    await checkErrorBanner(page, 'Servidor indisponível. Tente novamente.');

    // Com o mapping removido, o botao precisa recarregar a listagem sem exigir
    // um novo carregamento da pagina.
    await removeResponseStub(request, mappingId);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await checkHeadingScreen(page, skillFactory().name);

    await page.goto('/skills/999/update');
    await checkErrorBanner(page, 'habilidade não encontrada.');
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);
  });

  test('deve mostrar o estado vazio quando não há habilidades', async ({ page, request }) => {
    await deleteResourceApi(request, `/skills/delete_skill_by_id/${String(skillFactory().id)}`);

    await page.goto('/home');
    await checkHeadingScreen(page, 'Sua próxima habilidade começa aqui.');
  });
});
