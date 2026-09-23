import { type Page } from '@playwright/test';

// A confirmacao e um campo separado justamente para que o teste possa divergir
// dela e validar a mensagem de senhas diferentes.
export default async function redefinePasswordScenario(
  manipulePage: Page,
  passwordFake: { password: string; new_password: string; confirmation?: string },
): Promise<void> {
  await manipulePage.getByLabel('Senha atual', { exact: true }).fill(passwordFake.password);
  await manipulePage.getByLabel('Nova senha', { exact: true }).fill(passwordFake.new_password);
  await manipulePage
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill(passwordFake.confirmation ?? passwordFake.new_password);
  await manipulePage.getByRole('button', { name: 'Salvar nova senha' }).click();
}
