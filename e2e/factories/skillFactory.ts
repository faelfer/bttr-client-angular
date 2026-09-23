import skillCreate from '../mocks/default_skill_create.json';
import skillCreateUpdate from '../mocks/default_skill_create_update.json';
import skillDefault from '../mocks/default_skill.json';
import skillUpdate from '../mocks/default_skill_update.json';

export interface SkillFake {
  id: number;
  name: string;
  daily: number;
  created: string;
}

// O ciclo de vida de habilidade do WireMock so reconhece estes quatro
// registros: Java (id 1), sua versao alterada, Kotlin (id 2, criada pelo teste)
// e Quarkus (id 2 apos a alteracao). Um nome fora dessa lista faz o mock
// responder 409, entao os testes nao inventam habilidades.
const SKILLS_BY_KEY: Partial<Record<string, SkillFake>> = {
  default: skillDefault,
  update: skillUpdate,
  create: skillCreate,
  create_update: skillCreateUpdate,
};

export default function skillFactory(skillKey = 'default'): SkillFake {
  const skillByKey = SKILLS_BY_KEY[skillKey];

  if (skillByKey === undefined) {
    throw new Error(`skillFactory | habilidade desconhecida: ${skillKey}`);
  }

  return { ...skillByKey };
}
