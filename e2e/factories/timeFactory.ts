import timeCreate from '../mocks/default_time_create.json';
import timeCreateUpdate from '../mocks/default_time_create_update.json';
import timeDefault from '../mocks/default_time.json';
import timeUpdate from '../mocks/default_time_update.json';
import { SkillFake } from './skillFactory';

export interface TimeFake {
  id: number;
  minutes: number;
  created: string;
  skill: SkillFake;
}

// Mesma regra das habilidades: o ciclo de vida de tempo do WireMock conhece o
// registro base (id 1), o criado pelo teste (id 2) e as versoes alteradas dos
// dois. Qualquer outro valor cai no 409 de cenario fora de ordem.
const TIMES_BY_KEY: Partial<Record<string, TimeFake>> = {
  default: timeDefault,
  update: timeUpdate,
  create: timeCreate,
  create_update: timeCreateUpdate,
};

export default function timeFactory(timeKey = 'default'): TimeFake {
  const timeByKey = TIMES_BY_KEY[timeKey];

  if (timeByKey === undefined) {
    throw new Error(`timeFactory | tempo desconhecido: ${timeKey}`);
  }

  return { ...timeByKey, skill: { ...timeByKey.skill } };
}
