export function monthRange(date: Date): { initial: string; final: string } {
  return {
    initial: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
    final: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
  };
}
export function workingDays(year: number, month: number, lastDay: number): number {
  let count = 0;
  for (let day = 1; day <= lastDay; day++) {
    const weekday = new Date(year, month, day).getDay();
    if (weekday > 0 && weekday < 6) count++;
  }
  return count;
}
export function statistics(daily: number, total: number, date: Date) {
  const year = date.getFullYear(),
    month = date.getMonth();
  const businessDays = workingDays(year, month, new Date(year, month + 1, 0).getDate());
  const elapsed = workingDays(year, month, date.getDate());
  const todayIsWorkday = date.getDay() > 0 && date.getDay() < 6;
  const remainingDays = businessDays - elapsed + (todayIsWorkday ? 1 : 0);
  const goal = businessDays * daily;
  const ideal = elapsed * daily;
  const remaining = Math.max(0, goal - total);
  return {
    goal,
    ideal,
    businessDays,
    total,
    percentage: goal > 0 ? Math.trunc((total * 100) / goal) : 0,
    missing: Math.max(0, ideal - total),
    remaining,
    suggestion: Math.ceil(remaining / Math.max(1, remainingDays)),
    message:
      total >= goal
        ? 'Meta do mês concluída. Excelente trabalho!'
        : total >= ideal
          ? 'Você está em dia com sua meta. Continue assim!'
          : 'Um passo de cada vez. Ainda dá para avançar.',
  };
}
export function duration(minutes: number): string {
  const hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}min` : ''}` : `${rest}min`;
}
