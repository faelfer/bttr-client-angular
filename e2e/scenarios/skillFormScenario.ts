import { type Page } from '@playwright/test';

// O mesmo formulario cria e edita; o rotulo do botao e o que muda entre os dois
// modos.
export default async function skillFormScenario(
  manipulePage: Page,
  skillFake: { name: string; daily: number },
  isUpdate = false,
): Promise<void> {
  await manipulePage.getByLabel('Nome da habilidade').fill(skillFake.name);
  await manipulePage.getByLabel('Meta diária em minutos').fill(String(skillFake.daily));
  await manipulePage
    .getByRole('button', {
      name: isUpdate ? 'Salvar alterações' : 'Criar habilidade',
      exact: true,
    })
    .click();
}
