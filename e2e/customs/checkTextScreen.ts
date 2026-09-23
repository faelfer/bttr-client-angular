import { expect, type Page } from '@playwright/test';

export default async function checkTextScreen(
  manipulePage: Page,
  textToCheck: string,
): Promise<void> {
  await expect(manipulePage.getByText(textToCheck).first()).toBeVisible({ timeout: 15000 });
}
