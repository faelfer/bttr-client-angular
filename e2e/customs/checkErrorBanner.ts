import { expect, type Page } from '@playwright/test';

// Erro vindo da API aparece no app-status, acima do conteudo da pagina.
export default async function checkErrorBanner(
  manipulePage: Page,
  messageExpected: string,
): Promise<void> {
  await expect(
    manipulePage.locator('.error-banner').filter({ hasText: messageExpected }),
  ).toBeVisible({ timeout: 15000 });
}
