import { type Page } from '@playwright/test';

export default async function signInScenario(
  manipulePage: Page,
  userFake: { email: string; password: string },
): Promise<void> {
  await manipulePage.getByLabel('E-mail', { exact: true }).fill(userFake.email);
  await manipulePage.getByLabel('Senha', { exact: true }).fill(userFake.password);
  await manipulePage.getByRole('button', { name: 'Entrar', exact: true }).click();
}
