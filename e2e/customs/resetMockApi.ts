import { expect, type APIRequestContext } from '@playwright/test';

import assertResponseOk from './assertResponseOk';

// O contrato simulado guarda estado: criar uma habilidade avanca o cenario do
// WireMock e muda o que as proximas listagens devolvem. Sem reiniciar mappings,
// cenarios e requisicoes antes de cada teste, a ordem dos arquivos passa a
// decidir o resultado da suite.
export default async function resetMockApi(requestApi: APIRequestContext): Promise<void> {
  const responseHealth = await requestApi.get('/api/mock/health');
  await assertResponseOk(responseHealth, 'O mock do bttr-server não está saudável');
  expect((await responseHealth.json()) as unknown).toMatchObject({
    status: 'UP',
    service: 'bttr-api-mock',
  });

  await assertResponseOk(
    await requestApi.post('/api/__admin/mappings/reset'),
    'Não foi possível restaurar os mappings do WireMock',
  );
  await assertResponseOk(
    await requestApi.post('/api/__admin/scenarios/reset'),
    'Não foi possível reiniciar os cenários do WireMock',
  );
  await assertResponseOk(
    await requestApi.delete('/api/__admin/requests'),
    'Não foi possível limpar as requisições do WireMock',
  );
}
