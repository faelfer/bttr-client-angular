import { type Page } from '@playwright/test';

import checkHeadingScreen from './checkHeadingScreen';

export default async function checkOnSignIn(manipulePage: Page): Promise<void> {
  await checkHeadingScreen(manipulePage, 'Bom ter você de volta.');
}
