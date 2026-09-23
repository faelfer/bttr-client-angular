import { expect, type Page } from '@playwright/test';

// Sair, excluir a conta e receber 401 precisam apagar o token: uma sessao que
// sobrevive no localStorage devolve o usuario logado no proximo carregamento.
export default async function checkSessionCleared(manipulePage: Page): Promise<void> {
  expect(await manipulePage.evaluate(() => localStorage.getItem('bttr.token'))).toBeNull();
}
