import { type Page } from '@playwright/test';

// O formulario de perfil chega preenchido com os dados vindos da API, entao
// apenas os campos informados sao sobrescritos.
export default async function profileScenario(
  manipulePage: Page,
  userFake: { username?: string; email?: string },
): Promise<void> {
  if (userFake.username !== undefined) {
    await manipulePage.getByLabel('Nome de usuário').fill(userFake.username);
  }

  if (userFake.email !== undefined) {
    await manipulePage.getByLabel('E-mail').fill(userFake.email);
  }

  await manipulePage.getByRole('button', { name: 'Salvar alterações' }).click();
}
