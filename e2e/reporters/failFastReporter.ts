import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

// A suite e2e nao pode terminar verde escondendo teste que nao rodou. Este
// reporter separa os quatro desfechos possiveis e da a cada um o tratamento
// certo:
//
// 1. falha real (failed / timedOut): o proprio maxFailures do playwright.config
//    interrompe a execucao. Aqui so registramos o motivo para o log.
// 2. skip por bug conhecido (test.fixme): e uma decisao consciente sobre um bug
//    ja mapeado. Nao interrompe nada e nao reprova, mas aparece no resumo.
// 3. pre requisito nao atendido (test.skip em tempo de execucao, vindo de um
//    custom): o ambiente nao permitiu validar a tela. Nao interrompe a suite,
//    porque os outros arquivos continuam validos, mas reprova a execucao no
//    final para o relatorio nao passar por verde.
// 4. teste que nao chegou a rodar (skipped sem anotacao, interrupted, ou sem
//    resultado nenhum): a execucao parou antes dele, por maxFailures ou porque
//    um teste anterior do mesmo describe em modo serial falhou. Tambem reprova,
//    pela mesma razao do item 3: a tela ficou sem validacao nenhuma.
//
// Tratar todo "skipped" como motivo para matar a execucao seria pior do que nao
// ter fail-fast: um unico test.fixme derrubaria a suite no comeco e produziria
// um relatorio "ok" com um punhado de testes de dezenas.
const STATUS_FAILURE = ['failed', 'timedOut'];

// Um teste interrompido nao aparece como "skipped": sem tratar este status ele
// sumiria do resumo justamente na execucao que mais precisa dele.
const STATUS_NOT_RUN = ['skipped', 'interrupted'];

const TYPE_ANNOTATION_SKIP = ['skip', 'fixme'];

// O relatorio HTML do playwright calcula o proprio "ok" apenas a partir dos
// testes com desfecho inesperado, entao um skip por pre requisito nunca deixa a
// pagina vermelha. Este arquivo e o que carrega o veredito real para dentro da
// pasta de artefatos, ao lado do JUnit lido pelo Jenkins.
const FILE_NAME_SUMMARY = 'fail-fast-summary.json';

// A mensagem de erro do expect vem com as cores do terminal embutidas. Sem
// limpar, o motivo fica ilegivel tanto no log quanto no resumo em JSON.
// eslint-disable-next-line no-control-regex
const REGEX_ANSI = /\u001b\[[0-9;]*m/g;

interface SkipCollected {
  titlePath: string;
  reason: string;
  isKnownIssue: boolean;
}

interface FailureCollected {
  titlePath: string;
  status: string;
  reason: string;
}

export default class FailFastReporter implements Reporter {
  // Em `playwright test --list` nenhum teste roda, e sem esta distincao o
  // veredito abaixo reprovaria a listagem inteira: a IDE e qualquer script que
  // apenas enumera a suite passariam a sair com codigo 1. O `_mode` vem das
  // opcoes que o proprio playwright injeta no reporter; o argv cobre o caso de
  // uma versao que deixe de envia-lo.
  private readonly isListMode: boolean;
  private retriesConfigured = 0;
  private pathOutputDir = '';
  private suiteRoot: Suite | null = null;
  private readonly failuresCollected: FailureCollected[] = [];
  private readonly skipsCollected: SkipCollected[] = [];
  private readonly testsNotRun: string[] = [];

  constructor(optionsReporter: { _mode?: string } = {}) {
    this.isListMode = optionsReporter._mode === 'list' || process.argv.includes('--list');
  }

  onBegin(config: FullConfig, suite: Suite): void {
    // Quando o playwright para a execucao por maxFailures, os testes restantes
    // nao passam por onTestEnd: eles simplesmente ficam sem resultado. A arvore
    // de testes e a unica forma de enxergar esse grupo.
    this.suiteRoot = suite;

    // Em CI existem retries: uma falha so e definitiva quando as tentativas
    // acabam.
    this.retriesConfigured = config.projects.reduce(
      (retriesMax, projectLoop) => Math.max(retriesMax, projectLoop.retries),
      0,
    );

    // Todos os projetos compartilham o mesmo test-results por padrao, entao o
    // diretorio do primeiro e o destino do resumo.
    this.pathOutputDir = config.projects[0]?.outputDir ?? join(config.rootDir, 'test-results');
  }

  onTestEnd(testCase: TestCase, testResult: TestResult): void {
    const titlePath = testCase.titlePath().filter(Boolean).join(' > ');

    if (STATUS_FAILURE.includes(testResult.status)) {
      const retriesRemaining = testCase.retries - testResult.retry;

      if (retriesRemaining > 0) {
        return;
      }

      const reasonOfFailure = this.reasonOfFailure(testResult);

      this.failuresCollected.push({
        titlePath,
        status: testResult.status,
        reason: reasonOfFailure,
      });

      process.stderr.write(
        `\n[fail-fast] ${testResult.status.toUpperCase()} em "${titlePath}"\n` +
          `[fail-fast] motivo: ${reasonOfFailure}\n\n`,
      );
      return;
    }

    if (!STATUS_NOT_RUN.includes(testResult.status)) {
      return;
    }

    const annotationSkip = this.annotationOfSkip(testCase, testResult);

    // Sem anotacao o teste nao foi ignorado de proposito: ele nao chegou a
    // rodar porque a execucao parou antes (maxFailures) ou porque um teste
    // anterior do mesmo describe em modo serial falhou.
    if (annotationSkip === undefined) {
      this.testsNotRun.push(titlePath);
      return;
    }

    this.skipsCollected.push({
      titlePath,
      reason: annotationSkip.description ?? 'motivo não informado',
      isKnownIssue: annotationSkip.type === 'fixme',
    });
  }

  // O playwright espera um retorno assincrono aqui; o veredito so vale se
  // chegar como Promise.
  onEnd(fullResult: FullResult): Promise<{ status: 'failed' } | undefined> {
    if (this.isListMode) {
      return Promise.resolve(undefined);
    }

    const skipsKnownIssue = this.skipsCollected.filter((skipLoop) => skipLoop.isKnownIssue);
    const skipsPrecondition = this.skipsCollected.filter((skipLoop) => !skipLoop.isKnownIssue);

    const testsNotRun = this.titlePathsOfNotRun();

    const linesToWrite: string[] = [];

    if (this.failuresCollected.length) {
      linesToWrite.push(
        `\n[fail-fast] ${String(this.failuresCollected.length)} teste(s) com falha:`,
      );
      this.failuresCollected.forEach((failureLoop) => {
        linesToWrite.push(
          `  - [${failureLoop.status}] ${failureLoop.titlePath}\n      ${failureLoop.reason}`,
        );
      });
    }

    if (skipsPrecondition.length) {
      linesToWrite.push(
        `\n[fail-fast] ${String(skipsPrecondition.length)} teste(s) ignorado(s) por ` +
          'pré requisito de ambiente não atendido:',
      );
      skipsPrecondition.forEach((skipLoop) => {
        linesToWrite.push(`  - ${skipLoop.titlePath}\n      ${skipLoop.reason}`);
      });
    }

    if (skipsKnownIssue.length) {
      linesToWrite.push(
        `\n[fail-fast] ${String(skipsKnownIssue.length)} teste(s) ignorado(s) por bug ` +
          'conhecido (test.fixme), não reprovam a execução:',
      );
      skipsKnownIssue.forEach((skipLoop) => {
        linesToWrite.push(`  - ${skipLoop.titlePath}\n      ${skipLoop.reason}`);
      });
    }

    if (testsNotRun.length) {
      linesToWrite.push(
        `\n[fail-fast] ${String(testsNotRun.length)} teste(s) não chegaram a executar ` +
          'porque a suíte foi interrompida antes:',
      );
      testsNotRun.forEach((titlePathLoop) => {
        linesToWrite.push(`  - ${titlePathLoop}`);
      });
    }

    // Um pre requisito nao atendido, como um teste que nao rodou, deixa uma
    // tela sem validacao nenhuma: a execucao nao pode ser reportada como bem
    // sucedida.
    const isReproved =
      fullResult.status === 'passed' && Boolean(skipsPrecondition.length || testsNotRun.length);

    if (isReproved) {
      linesToWrite.push(
        '\n[fail-fast] execução reprovada: nenhuma falha, mas ' +
          `${String(skipsPrecondition.length + testsNotRun.length)} teste(s) não puderam ser validados.`,
      );
    }

    if (linesToWrite.length) {
      process.stderr.write(`${linesToWrite.join('\n')}\n\n`);
    }

    this.writeSummary({
      statusReported: isReproved ? 'failed' : fullResult.status,
      statusOfPlaywright: fullResult.status,
      failures: this.failuresCollected,
      skipsPrecondition,
      skipsKnownIssue,
      testsNotRun,
    });

    return Promise.resolve(isReproved ? { status: 'failed' as const } : undefined);
  }

  // Um teste pode nao ter sido validado de duas formas: com um resultado
  // "skipped"/"interrupted" sem anotacao, colhido em onTestEnd, ou sem
  // resultado nenhum, quando o playwright encerrou a execucao antes de chegar
  // nele. As duas origens contam a mesma coisa, entao viram uma lista unica.
  private titlePathsOfNotRun(): string[] {
    const titlePathsNeverRan = (this.suiteRoot?.allTests() ?? [])
      .filter((testLoop) => !testLoop.results.length)
      .map((testLoop) => testLoop.titlePath().filter(Boolean).join(' > '));

    return [...new Set([...this.testsNotRun, ...titlePathsNeverRan])];
  }

  // O resumo fica ao lado das capturas e traces para que a pasta de artefatos
  // conte a mesma historia que o console, sem depender de quem leu a saida.
  private writeSummary(summaryToWrite: Record<string, unknown>): void {
    if (!this.pathOutputDir) {
      return;
    }

    const pathSummary = join(this.pathOutputDir, FILE_NAME_SUMMARY);

    try {
      mkdirSync(dirname(pathSummary), { recursive: true });
      writeFileSync(pathSummary, `${JSON.stringify(summaryToWrite, null, 2)}\n`, 'utf8');
    } catch (errorToWrite) {
      // Nao poder gravar o resumo nao pode mudar o resultado da execucao.
      process.stderr.write(
        `[fail-fast] não foi possível gravar ${pathSummary}: ${(errorToWrite as Error).message}\n`,
      );
    }
  }

  private annotationOfSkip(
    testCase: TestCase,
    testResult: TestResult,
  ): { type: string; description?: string } | undefined {
    // Um skip em tempo de execucao anota o motivo no resultado; um modificador
    // declarado no arquivo anota no proprio teste.
    const annotationsToRead = [...testResult.annotations, ...testCase.annotations];

    return annotationsToRead.find((annotationLoop) =>
      TYPE_ANNOTATION_SKIP.includes(annotationLoop.type),
    );
  }

  private reasonOfFailure(testResult: TestResult): string {
    const messageOfError = (testResult.error?.message ?? '')
      .replace(REGEX_ANSI, '')
      .split('\n')
      .map((lineLoop) => lineLoop.trim())
      .find(Boolean);

    return (
      messageOfError ?? `${String(this.retriesConfigured)} tentativa(s) configurada(s) esgotada(s)`
    );
  }
}
