import { expect, type Page } from '@playwright/test';

// A suite roda em desktop e em celular. Conteudo que estoura a largura da
// viewport aparece como barra de rolagem horizontal, e o titulo ausente indica
// que a pagina ficou presa no carregamento.
export default async function checkLayoutFits(manipulePage: Page): Promise<void> {
  await expect(manipulePage.locator('app-status .loading')).toHaveCount(0);
  await expect(manipulePage.locator('main h1')).toBeVisible({ timeout: 15000 });
  expect(
    await manipulePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
}
