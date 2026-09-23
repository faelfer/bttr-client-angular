import { type Page } from '@playwright/test';

// Toda exclusao do app passa pelo mesmo p-confirmdialog, montado uma unica vez
// no app.component.
export default async function confirmDeleteScenario(
  manipulePage: Page,
  isConfirm = true,
): Promise<void> {
  await manipulePage
    .getByRole('button', { name: isConfirm ? 'Sim, excluir' : 'Cancelar', exact: true })
    .click();
}
