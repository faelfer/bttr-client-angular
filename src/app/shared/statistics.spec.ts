import { duration, monthRange, statistics, workingDays } from './statistics';
describe('Estatísticas mensais', () => {
  it('conta apenas segunda a sexta, incluindo ano bissexto', () => {
    expect(workingDays(2024, 1, 29)).toBe(21);
    expect(workingDays(2026, 8, 30)).toBe(22);
  });
  it('inclui o último milissegundo do mês no fuso local', () => {
    const range = monthRange(new Date(2024, 1, 10));
    expect(new Date(range.initial)).toEqual(new Date(2024, 1, 1));
    expect(new Date(range.final)).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
  });
  it('calcula meta, atraso e sugestão sem contar sábado como dia útil', () => {
    const result = statistics(30, 120, new Date(2026, 8, 12));
    expect(result).toMatchObject({
      goal: 660,
      ideal: 270,
      missing: 150,
      remaining: 540,
      percentage: 18,
      suggestion: 42,
    });
  });
  it('não gera sugestão negativa quando a meta é ultrapassada', () => {
    expect(statistics(30, 800, new Date(2026, 8, 30))).toMatchObject({
      percentage: 121,
      missing: 0,
      remaining: 0,
      suggestion: 0,
    });
  });
  it('mantém resultados finitos no último fim de semana do mês', () => {
    const result = statistics(30, 0, new Date(2026, 0, 31));
    expect(Number.isFinite(result.suggestion)).toBe(true);
    expect(statistics(0, 0, new Date()).percentage).toBe(0);
  });
  it.each([
    [0, '0min'],
    [30, '30min'],
    [60, '1h'],
    [125, '2h 5min'],
    [1440, '24h'],
  ])('formata %s minutos', (value, label) => {
    expect(duration(value as number)).toBe(label);
  });
});
