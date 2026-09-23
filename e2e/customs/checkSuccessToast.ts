import { expect, type Page } from '@playwright/test';

// As mensagens de sucesso vem do back end e sao exibidas pelo p-toast montado
// no app.component. O toast se fecha sozinho, entao a conferencia precisa vir
// logo depois da acao que o disparou.
export default async function checkSuccessToast(
  manipulePage: Page,
  messageExpected: string,
): Promise<void> {
  await expect(manipulePage.locator('p-toast').filter({ hasText: messageExpected })).toBeVisible({
    timeout: 15000,
  });
}
