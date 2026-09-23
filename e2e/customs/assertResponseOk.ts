import { type APIResponse } from '@playwright/test';

// Uma falha de infraestrutura precisa dizer o que quebrou: sem o status e o
// corpo da resposta, um mock fora do ar vira um "expect" generico no meio do
// teste e o motivo real se perde.
export default async function assertResponseOk(
  responseToCheck: APIResponse,
  actionDescription: string,
): Promise<void> {
  if (responseToCheck.ok()) {
    return;
  }

  throw new Error(
    `${actionDescription}: HTTP ${String(responseToCheck.status())} - ${await responseToCheck.text()}`,
  );
}
