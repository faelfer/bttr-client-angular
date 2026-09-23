import { type Page } from '@playwright/test';

import checkHeadingScreen from './checkHeadingScreen';

export default async function checkOnHome(manipulePage: Page): Promise<void> {
  await checkHeadingScreen(manipulePage, 'Minhas habilidades');
}
