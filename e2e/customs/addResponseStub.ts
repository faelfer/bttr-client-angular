import { expect, type APIRequestContext } from '@playwright/test';

import assertResponseOk from './assertResponseOk';

// Cenarios de erro que o contrato simulado nao tem de fabrica (503, 401 no
// perfil, payload malicioso na listagem) entram como mapping temporario de
// prioridade alta. Devolve o id para que o teste possa remove-lo e voltar ao
// comportamento normal na mesma execucao.
export default async function addResponseStub(
  requestApi: APIRequestContext,
  { method, urlPath }: { method: string; urlPath: string },
  { status, jsonBody }: { status: number; jsonBody: unknown },
): Promise<string> {
  const responseStub = await requestApi.post('/api/__admin/mappings', {
    data: {
      priority: 1,
      request: { method, urlPath },
      response: {
        status,
        jsonBody,
        headers: { 'Content-Type': 'application/json' },
      },
    },
  });
  await assertResponseOk(
    responseStub,
    `Não foi possível configurar ${method} ${urlPath} no WireMock`,
  );

  const payloadStub = (await responseStub.json()) as { id?: unknown };
  expect(typeof payloadStub.id, 'WireMock não retornou o ID do mapping').toBe('string');

  return payloadStub.id as string;
}
