import { type Page } from '@playwright/test';

export default async function signUpScenario(
  manipulePage: Page,
  userFake: { username: string; email: string; password: string },
): Promise<void> {
  await manipulePage.getByLabel('Nome de usuário').fill(userFake.username);
  await manipulePage.getByLabel('E-mail', { exact: true }).fill(userFake.email);
  await manipulePage.getByLabel('Senha', { exact: true }).fill(userFake.password);
  await manipulePage.getByRole('button', { name: 'Criar minha conta' }).click();
}
