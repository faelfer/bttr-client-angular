import { type APIRequestContext } from '@playwright/test';

import assertResponseOk from './assertResponseOk';

export default async function removeResponseStub(
  requestApi: APIRequestContext,
  mappingId: string,
): Promise<void> {
  await assertResponseOk(
    await requestApi.delete(`/api/__admin/mappings/${encodeURIComponent(mappingId)}`),
    `Não foi possível remover o mapping ${mappingId} do WireMock`,
  );
}
