// Registra o benchmarkIndex do agente que rodou o Lighthouse. É o número que
// justifica (ou desmente) o cpuSlowdownMultiplier fixado em lighthouserc.cjs.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const directory = process.env.LHCI_REPORT_DIR ?? 'lighthouse-report';

let files;
try {
  files = (await readdir(directory)).filter((name) => name.endsWith('.report.json'));
} catch {
  console.error(`Nenhum relatório Lighthouse encontrado em ${directory}.`);
  process.exit(1);
}
if (files.length === 0) {
  console.error(`Nenhum relatório Lighthouse encontrado em ${directory}.`);
  process.exit(1);
}

const indexes = [];
for (const file of files) {
  const report = JSON.parse(await readFile(join(directory, file), 'utf8'));
  const index = report.environment?.benchmarkIndex;
  if (typeof index === 'number') indexes.push(Math.round(index));
}
if (indexes.length === 0) {
  console.error('Os relatórios não trazem environment.benchmarkIndex.');
  process.exit(1);
}

indexes.sort((first, second) => first - second);
const median = indexes[Math.floor(indexes.length / 2)];
const multiplier = 2;

console.log(
  `Lighthouse · benchmarkIndex do agente: mediana ${median} ` +
    `(${indexes.length} execuções, de ${indexes[0]} a ${indexes[indexes.length - 1]}).`,
);
console.log(
  `Lighthouse · cpuSlowdownMultiplier fixado em ${multiplier}x. ` +
    'Revalide lighthouserc.cjs se esta mediana mudar de patamar.',
);
