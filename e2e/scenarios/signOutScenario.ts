import { type Page } from '@playwright/test';

// O botao de sair vive na barra lateral do shell, disponivel em toda area
// autenticada.
export default async function signOutScenario(manipulePage: Page): Promise<void> {
  await manipulePage.getByRole('button', { name: 'Sair da conta' }).click();
}
