import { type Page } from '@playwright/test';

export default async function forgotPasswordScenario(
  manipulePage: Page,
  userFake: { email: string },
): Promise<void> {
  await manipulePage.getByLabel('E-mail', { exact: true }).fill(userFake.email);
  await manipulePage.getByRole('button', { name: 'Enviar link de recuperação' }).click();
}
