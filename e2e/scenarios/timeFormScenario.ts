import { expect, type Page } from '@playwright/test';

// A habilidade so e trocada quando o teste pede: o formulario ja chega com a
// habilidade do registro em edicao, ou com a que veio pela query string.
export default async function timeFormScenario(
  manipulePage: Page,
  timeFake: { minutes: number; skillName?: string },
  isUpdate = false,
): Promise<void> {
  if (timeFake.skillName !== undefined) {
    const selectLocator = manipulePage.getByRole('combobox', { name: 'Habilidade', exact: true });
    await selectLocator.click();
    await manipulePage.getByRole('option', { name: timeFake.skillName, exact: true }).click();
    await expect(selectLocator).toContainText(timeFake.skillName);
  }

  await manipulePage.getByLabel('Tempo dedicado em minutos').fill(String(timeFake.minutes));
  await manipulePage
    .getByRole('button', {
      name: isUpdate ? 'Salvar alterações' : 'Registrar tempo',
      exact: true,
    })
    .click();
}
