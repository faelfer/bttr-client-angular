import { type APIRequestContext } from '@playwright/test';

import userFactory from '../factories/userFactory';
import assertResponseOk from './assertResponseOk';

// Alguns estados do contrato simulado so sao alcancados excluindo o registro
// base. Fazer isso por HTTP, e nao pela interface, mantem o teste focado na
// tela que ele quer validar em vez de reexecutar um fluxo ja coberto.
export default async function deleteResourceApi(
  requestApi: APIRequestContext,
  urlPath: string,
): Promise<void> {
  await assertResponseOk(
    await requestApi.delete(`/api${urlPath}`, {
      headers: { Authorization: `Token ${userFactory('default').token}` },
    }),
    `Não foi possível excluir ${urlPath} no mock do bttr-server`,
  );
}
