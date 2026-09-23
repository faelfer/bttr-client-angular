import type { FullConfig } from '@playwright/test';

// O webServer do playwright sobe o Angular antes deste globalSetup, mas nada
// garante que o WireMock do bttr-server esteja no ar: sem ele, cada arquivo de
// teste falha sozinho no reset do mock e o log nao diz que o problema e de
// ambiente, e nao do aplicativo.
//
// A conferencia fica aqui, e nao em um script do package.json, para valer em
// qualquer forma de execucao: npm run test:e2e, --headed, --debug, um arquivo
// isolado ou o runner da IDE.
const PATH_HEALTH = '/api/mock/health';

// O mock demora a responder logo depois de o container subir; a espera cobre
// esse intervalo sem mascarar uma ausencia real.
const ATTEMPTS_MAX = 15;
const DELAY_BETWEEN_ATTEMPTS = 2000;

async function readHealth(urlHealth: string): Promise<string> {
  const responseHealth = await fetch(urlHealth, { cache: 'no-store' });

  if (!responseHealth.ok) {
    return `HTTP ${String(responseHealth.status)}`;
  }

  const payloadHealth = (await responseHealth.json()) as { status?: unknown; service?: unknown };

  if (payloadHealth.status !== 'UP' || payloadHealth.service !== 'bttr-api-mock') {
    return `resposta inesperada: ${JSON.stringify(payloadHealth)}`;
  }

  return '';
}

export default async function prepareMockApi(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL;

  if (baseURL === undefined) {
    throw new Error('prepareMockApi | configure baseURL em playwright.config.ts.');
  }

  const urlHealth = new URL(PATH_HEALTH, baseURL).toString();
  let reasonLast = 'não houve resposta';

  for (let attemptLoop = 1; attemptLoop <= ATTEMPTS_MAX; attemptLoop += 1) {
    try {
      reasonLast = await readHealth(urlHealth);

      if (!reasonLast) {
        return;
      }
    } catch (errorToRead) {
      reasonLast = (errorToRead as Error).message;
    }

    await new Promise((resolveLoop) => setTimeout(resolveLoop, DELAY_BETWEEN_ATTEMPTS));
  }

  throw new Error(
    `O mock do bttr-server não respondeu em ${urlHealth} (${reasonLast}). ` +
      'Suba ../bttr-server/compose.mock.yaml na porta 8090 ou execute a suíte ' +
      'por compose.e2e.yaml antes de rodar os testes.',
  );
}
