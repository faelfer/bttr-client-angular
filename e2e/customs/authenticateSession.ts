import { type Page } from '@playwright/test';

import userFactory from '../factories/userFactory';

// Grava o token antes de qualquer script da pagina rodar, para que a guarda de
// rota ja encontre a sessao pronta. Os testes que nao estao validando a tela de
// acesso comecam por aqui em vez de repetir o login pela interface.
export default async function authenticateSession(manipulePage: Page): Promise<void> {
  await manipulePage.addInitScript((tokenToSet: string) => {
    localStorage.setItem('bttr.token', tokenToSet);
  }, userFactory('default').token);
}
