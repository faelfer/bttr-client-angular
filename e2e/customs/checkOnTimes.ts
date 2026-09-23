import { type Page } from '@playwright/test';

import checkHeadingScreen from './checkHeadingScreen';

export default async function checkOnTimes(manipulePage: Page): Promise<void> {
  await checkHeadingScreen(manipulePage, 'Histórico de tempo');
}
