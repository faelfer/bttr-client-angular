import { expect, type Page } from '@playwright/test';

// O titulo da pagina e a referencia estavel de "estou na tela certa": o texto
// corrido pode se repetir em banner, menu e mensagem de lista vazia.
export default async function checkHeadingScreen(
  manipulePage: Page,
  headingToCheck: string,
): Promise<void> {
  await expect(
    manipulePage.getByRole('heading', { name: headingToCheck, exact: true }),
  ).toBeVisible({ timeout: 15000 });
}
