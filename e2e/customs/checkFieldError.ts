import { expect, type Page } from '@playwright/test';

// As mensagens de campo invalido sao renderizadas pelo app-field-error com
// role="alert"; procurar pelo papel evita casar com o texto de ajuda que fica
// logo acima do campo.
export default async function checkFieldError(
  manipulePage: Page,
  messageExpected: string,
): Promise<void> {
  await expect(
    manipulePage.getByRole('alert').filter({ hasText: messageExpected }).first(),
  ).toBeVisible({ timeout: 15000 });
}
