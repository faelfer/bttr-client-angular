import userConflict from '../mocks/default_user_conflict.json';
import userDenied from '../mocks/default_user_denied.json';
import userDefault from '../mocks/default_user.json';
import userUpdate from '../mocks/default_user_update.json';

export interface UserFake {
  id: number;
  username: string;
  email: string;
  password: string;
  created: string;
  token: string;
}

// Cada chave espelha um arquivo de e2e/mocks e representa um usuario que o
// contrato simulado do bttr-server ja conhece. "denied" e "conflict" existem
// porque o WireMock responde 401 e 409 a esses e-mails especificos.
const USERS_BY_KEY: Partial<Record<string, UserFake>> = {
  default: userDefault,
  update: userUpdate,
  denied: userDenied,
  conflict: userConflict,
};

// Sequencia por execucao: garante um e-mail diferente a cada chamada sem
// depender de relogio ou sorteio, que tornariam a falha dificil de reproduzir.
let countGenerated = 0;

// userFactory("default") devolve uma copia do mock informado.
// userFactory() devolve um usuario novo, util para cadastro e casos de erro.
export default function userFactory(userKey?: string): UserFake {
  if (userKey !== undefined) {
    const userByKey = USERS_BY_KEY[userKey];

    if (userByKey === undefined) {
      throw new Error(`userFactory | usuario desconhecido: ${userKey}`);
    }

    // A copia evita que um teste altere o mock usado pelos demais.
    return { ...userByKey };
  }

  countGenerated += 1;

  return {
    id: 1000 + countGenerated,
    username: `Pessoa nova ${String(countGenerated)}`,
    email: `pessoa.nova.${String(countGenerated)}@example.com`,
    password: 'SenhaLonga123!',
    created: '2026-01-01T10:00:00Z',
    token: '',
  };
}
