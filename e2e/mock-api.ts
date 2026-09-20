import { expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';

export const MOCK_TOKEN = 'mock-access-token';
export const AUTHORIZATION = { Authorization: `Token ${MOCK_TOKEN}` };

async function assertOk(response: APIResponse, action: string): Promise<void> {
  if (!response.ok()) {
    throw new Error(`${action}: HTTP ${String(response.status())} - ${await response.text()}`);
  }
}

export async function resetMockApi(request: APIRequestContext): Promise<void> {
  const health = await request.get('/api/mock/health');
  await assertOk(health, 'O mock do bttr-server não está saudável');
  expect((await health.json()) as unknown).toMatchObject({
    status: 'UP',
    service: 'bttr-api-mock',
  });

  await assertOk(
    await request.post('/api/__admin/mappings/reset'),
    'Não foi possível restaurar os mappings do WireMock',
  );
  await assertOk(
    await request.post('/api/__admin/scenarios/reset'),
    'Não foi possível reiniciar os cenários do WireMock',
  );
  await assertOk(
    await request.delete('/api/__admin/requests'),
    'Não foi possível limpar as requisições do WireMock',
  );
}

export async function authenticate(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem('bttr.token', token);
  }, MOCK_TOKEN);
}

export async function expectRequestBody(
  request: APIRequestContext,
  method: string,
  path: string,
  expected: unknown,
): Promise<void> {
  const response = await request.post('/api/__admin/requests/find', {
    data: { method, urlPath: path },
  });
  await assertOk(response, `Não foi possível consultar ${method} ${path} no WireMock`);

  const payload = (await response.json()) as {
    requests?: { body?: string }[];
  };
  const body = payload.requests?.at(-1)?.body;
  expect(body, `Nenhuma requisição ${method} ${path} foi registrada`).toBeDefined();
  expect(JSON.parse(body ?? 'null') as unknown).toEqual(expected);
}

export async function addResponseStub(
  request: APIRequestContext,
  method: string,
  path: string,
  status: number,
  jsonBody: unknown,
): Promise<string> {
  const response = await request.post('/api/__admin/mappings', {
    data: {
      priority: 1,
      request: { method, urlPath: path },
      response: {
        status,
        jsonBody,
        headers: { 'Content-Type': 'application/json' },
      },
    },
  });
  await assertOk(response, `Não foi possível configurar ${method} ${path} no WireMock`);
  const payload = (await response.json()) as { id?: unknown };
  if (typeof payload.id !== 'string') throw new Error('WireMock não retornou o ID do mapping.');
  return payload.id;
}

export async function removeResponseStub(
  request: APIRequestContext,
  mappingId: string,
): Promise<void> {
  await assertOk(
    await request.delete(`/api/__admin/mappings/${encodeURIComponent(mappingId)}`),
    `Não foi possível remover o mapping ${mappingId} do WireMock`,
  );
}
