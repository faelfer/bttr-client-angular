import { expect, type APIRequestContext } from '@playwright/test';

import assertResponseOk from './assertResponseOk';

// A tela pode navegar e mostrar sucesso enviando o payload errado. O journal de
// requisicoes do WireMock e a evidencia do que o navegador realmente mandou.
export default async function checkRequestBody(
  requestApi: APIRequestContext,
  { method, urlPath }: { method: string; urlPath: string },
  bodyExpected: unknown,
): Promise<void> {
  const responseFind = await requestApi.post('/api/__admin/requests/find', {
    data: { method, urlPath },
  });
  await assertResponseOk(
    responseFind,
    `Não foi possível consultar ${method} ${urlPath} no WireMock`,
  );

  const payloadFound = (await responseFind.json()) as { requests?: { body?: string }[] };
  const bodyFound = payloadFound.requests?.at(-1)?.body;

  expect(bodyFound, `Nenhuma requisição ${method} ${urlPath} foi registrada`).toBeDefined();
  expect(JSON.parse(bodyFound ?? 'null') as unknown).toEqual(bodyExpected);
}
