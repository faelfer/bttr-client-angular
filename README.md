# Bttr Angular

Frontend de acompanhamento de habilidades e tempo de prática, implementado a partir das rotas, serviços, formulários e regras do projeto `../bttr-client-react`. Usa **npm, Angular 21, PrimeNG 21, Prettier, ESLint, Jest e Playwright**.

## Executar

Requisitos: Node.js 22.12+ na linha 22 (ou Node.js 24+) e npm.

```bash
npm ci
npm start
```

Abra **http://localhost:4200**. O backend `bttr-server` deve estar disponível em **http://localhost:8000**. Para iniciar o servidor e suas dependências, siga o README daquele projeto.

A configuração pública fica em [`public/config.json`](public/config.json) e é carregada antes da inicialização do Angular:

```json
{ "apiUrl": "/api" }
```

Durante `npm start`, [`proxy.conf.json`](proxy.conf.json) encaminha `/api/**` para `http://localhost:8000`, removendo `/api`. Assim o navegador usa a mesma origem do frontend. Se a API estiver em outro endereço local, altere o `target` do proxy e reinicie o frontend.

O proxy preserva o cabeçalho `Origin` enviado pelo navegador, portanto o backend também precisa permitir `http://localhost:4200`. A configuração local padrão do `bttr-server` já inclui essa origem. Se usar uma URL absoluta da API ou executar o frontend em outra origem, ajuste `CORS_ORIGINS` no backend.

Nenhuma credencial ou segredo deve ser colocado em `config.json`: esse arquivo é público. Não há dados simulados no aplicativo; os mocks são exclusivos dos testes Playwright.

## Funcionalidades e navegação

| Página                | Rota                         | Funcionalidade                                                  |
| --------------------- | ---------------------------- | --------------------------------------------------------------- |
| Acesso                | `/`                          | Login por e-mail e senha, retorno à página protegida solicitada |
| Cadastro              | `/sign-up`                   | Criação de conta                                                |
| Recuperação           | `/forgot-password`           | Envio de instruções por e-mail e retorno ao login               |
| Habilidades           | `/home`                      | Lista paginada, acesso à edição e às estatísticas               |
| Nova habilidade       | `/skills/create`             | Nome e meta diária em minutos                                   |
| Editar habilidade     | `/skills/:skillId/update`    | Atualização e exclusão com confirmação                          |
| Estatísticas          | `/skills/:skillId/statistic` | Meta mensal, acumulado, percentual, atraso e sugestão diária    |
| Histórico             | `/times`                     | Registros paginados com habilidade, duração e data              |
| Registrar tempo       | `/times/create`              | Seleção da habilidade e minutos dedicados                       |
| Editar tempo          | `/times/:timeId/update`      | Atualização e exclusão com confirmação                          |
| Perfil                | `/profile`                   | Consulta, edição, exclusão de conta e acesso à troca de senha   |
| Alterar senha         | `/redefine-password`         | Senha atual, nova senha e confirmação                           |
| Página não encontrada | `**`                         | Recuperação da navegação para rotas inexistentes                |

As páginas privadas usam guardas. O token persiste em `localStorage` (`bttr.token`) e é enviado como `Authorization: Token <token>` apenas aos endpoints privados da API configurada. Uma resposta 401 privada encerra a sessão e retorna ao login. Não há endpoint de renovação de token no contrato original. A navegação permite sair da conta em qualquer página privada.

## Contrato HTTP preservado

Os serviços estão em [`src/app/core/api.service.ts`](src/app/core/api.service.ts). As mutações recebem `{message}`; consultas individuais usam `{user}`, `{skill}` e `{time}`. Listagens paginadas usam `{count,next,previous,results}`, com 5 itens e páginas começando em 1.

| Método               | Endpoint                         | Payload / parâmetros                                 |
| -------------------- | -------------------------------- | ---------------------------------------------------- |
| POST                 | `/users/sign_in`                 | `{email,password}` → `{token,user,message}`          |
| POST                 | `/users/sign_up`                 | `{username,email,password}`                          |
| POST                 | `/users/forgot_password`         | `{email}`                                            |
| GET / PATCH / DELETE | `/users/profile`                 | PATCH: `{username,email}`                            |
| POST                 | `/users/redefine_password`       | `{password,new_password}`                            |
| GET                  | `/skills/skills_from_user`       | → `{skills}`                                         |
| GET                  | `/skills/skills_by_page`         | `page`                                               |
| GET                  | `/skills/skill_by_id/:id`        | → `{skill}`                                          |
| POST                 | `/skills/create_skill`           | `{name,daily}`                                       |
| PUT                  | `/skills/update_skill_by_id/:id` | `{name,daily}`                                       |
| DELETE               | `/skills/delete_skill_by_id/:id` | Sem corpo                                            |
| GET                  | `/times/times_by_page`           | `page`                                               |
| GET                  | `/times/times_by_date`           | `skill_id`, `date_initial`, `date_final` → `{times}` |
| GET                  | `/times/time_by_id/:id`          | → `{time}`                                           |
| POST                 | `/times/create_time`             | `{skill_id,minutes}`                                 |
| PUT                  | `/times/update_time_by_id/:id`   | `{skill_id,minutes}`                                 |
| DELETE               | `/times/delete_time_by_id/:id`   | Sem corpo                                            |

## Regras e ajustes em relação ao React

- Mantidas as rotas e operações do cliente original, com componentes standalone, carregamento de páginas sob demanda, formulários reativos, signals e HttpClient.
- Meta diária e tempo registrado são inteiros de 1 a 1440. Os payloads enviam números, conforme o backend local.
- Nomes de usuário têm de 2 a 100 caracteres; habilidades, de 2 a 120. Senhas novas têm de 4 a 128 caracteres, com maiúscula, minúscula, número e símbolo, conforme `bttr-server/Contracts.java`. O login não impõe requisitos de composição à senha existente.
- Recuperação informa envio de **link**, compatível com o backend atual. O cliente React mencionava senha temporária.
- Estatísticas consideram o mês atual e dias de segunda a sexta, sem descontar feriados. A consulta cobre o primeiro instante até o último milissegundo do mês no fuso local do navegador, convertido para ISO-8601. Isso corrige o encerramento antecipado do último dia no cliente React.
- A sugestão divide o saldo da meta pelos dias úteis restantes, incluindo hoje quando for dia útil, arredondando para cima. Não inclui o sábado/domingo como dia adicional; evita divisão por zero e valores negativos.
- Percentuais podem ultrapassar 100%; a barra visual limita-se a 100%.
- A data do registro é gerada pelo servidor e preservada em edições.
- Criações, edições e exclusões de habilidade/tempo retornam à lista atualizada. O registro iniciado pelas estatísticas já seleciona a habilidade.
- Exclusões pedem confirmação e descrevem o alcance da operação. Erros mantêm o formulário; falhas de leitura oferecem nova tentativa. Envios duplicados são bloqueados enquanto a operação está em andamento.
- Interface responsiva em português com componentes PrimeNG, campos rotulados, navegação por teclado, foco visível, estados vazios, carregamento e mensagens de erro/sucesso.

## Qualidade e testes

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:e2e:security
npm run test:lighthouse:ci
npm run security:audit
```

O ESLint usa análise tipada estrita para TypeScript e as regras recomendadas de código, templates e acessibilidade do Angular. O Stylelint valida o CSS com a configuração padrão, enquanto o Prettier permanece responsável exclusivamente pela formatação. `npm run format` formata os arquivos e `npm run lint:fix` aplica as correções automáticas dos dois linters.

`npm run ci` executa formatação, lint, checagem de tipos e Jest com cobertura. O `Jenkinsfile` chama esse mesmo fluxo pelo serviço `ci` de `compose.ci.yaml`, que também executa o build de produção e valida os budgets do Angular. Em seguida, o pipeline obtém o `bttr-server` do GitLab, constrói sua imagem WireMock e executa o Playwright com `compose.e2e.yaml`. O Lighthouse CI mede as rotas públicas três vezes pelo serviço `lighthouse` de `compose.performance.yaml`. Por último, a etapa `Security scans` executa o fluxo reproduzível de `compose.security.yaml`.

O SonarScanner CLI oficial está fixado no serviço `sonar-scanner` de
[`compose.ci.yaml`](compose.ci.yaml) e configurado em
[`sonar-project.properties`](sonar-project.properties). A análise usa a chave
`bttr-client-angular`, o nome `BTTR Client Angular` e importa a cobertura Jest de
`coverage/lcov.info`. Para enviar uma análise manual, gere um token com permissão
**Execute Analysis** e execute:

```bash
export SONAR_HOST_URL=http://host.docker.internal:9000
export SONAR_TOKEN='<token>'
npm run test:coverage -- --ci
docker compose -f compose.ci.yaml run --rm sonar-scanner
```

O token é um segredo e não deve ser adicionado ao `.env`, ao `package.json` nem ao
repositório.

O Lighthouse CI permanece fixado em `0.15.1`. Os overrides atualizam Lighthouse e dependências transitivas vulneráveis sem alterar a interface do runner; remova-os quando uma versão do `@lhci/cli` já incorporar essas correções.

Jest verifica contratos HTTP (métodos, caminhos, payloads e parâmetros), sessão, interceptor, guardas, validações, datas e estatísticas. Playwright testa login, cadastro, recuperação, perfil, troca de senha, exclusões, CRUD de habilidades e tempos, paginação, estatísticas, erros, estados vazios e layout em Chromium desktop e celular. A especificação `e2e/security.spec.ts` acrescenta regressões contra redirecionamento aberto, XSS e vazamento do token; ela faz parte da suíte completa e pode ser executada isoladamente com `npm run test:e2e:security`.

Os testes E2E iniciam o servidor Angular automaticamente e consultam por HTTP a imagem WireMock mantida em `bttr-server/mock-api`. Cada teste restaura os mappings, cenários e requisições do WireMock para manter o isolamento. A suíte valida a integração do navegador com o contrato simulado, mas **não executa Quarkus, Keycloak, PostgreSQL ou e-mail reais**.

Com `bttr-server` no diretório irmão, execute o mesmo ambiente usado pelo Jenkins:

```bash
export CI_UID="$(id -u)" CI_GID="$(id -g)"
docker compose -f compose.e2e.yaml run --rm e2e
docker compose -f compose.e2e.yaml down --remove-orphans
```

Por padrão, a execução local usa `../bttr-server/mock-api`. No Jenkins, os parâmetros `BTTR_SERVER_REPOSITORY` e `BTTR_SERVER_BRANCH` controlam o checkout em `.ci/bttr-server`.

O fluxo de segurança usa versões fixadas do Trivy (`0.74.0`), Gitleaks (`8.30.1`) e OWASP ZAP (`2.17.0`). O `npm audit` e o Trivy bloqueiam vulnerabilidades HIGH/CRITICAL, o Gitleaks bloqueia segredos no histórico Git e o ZAP bloqueia alertas HIGH. O ZAP executa os spiders tradicional e client-side, autentica no WireMock e examina somente o build efêmero local — nenhum ambiente externo é atacado. Alertas médios permanecem visíveis nos relatórios para triagem sem bloquear o pipeline.

Com `bttr-server` no diretório irmão, execute exatamente a etapa de segurança usada pelo Jenkins:

```bash
export CI_UID="$(id -u)" CI_GID="$(id -g)"
./scripts/security.sh
```

Para executar fora do Compose, suba `../bttr-server/compose.mock.yaml` na porta 8090 e instale o Chromium do Playwright:

```bash
docker compose -f ../bttr-server/compose.mock.yaml up -d --build mock-api
npx playwright install chromium
npm run test:e2e
```

Relatórios: `coverage/` (Jest e entrada LCOV do SonarQube), `playwright-report/` (E2E), `test-results/` (JUnit, capturas e traces de falhas), `lighthouse-report/` (HTML/JSON de performance) e `security-reports/` (npm audit, Trivy, Gitleaks e ZAP em JSON, HTML ou SARIF). Abra o relatório E2E com `npm run test:e2e:report`. O Lighthouse exige nota de performance mínima de 0,8, LCP de até 3,5 s, CLS de até 0,1 e TBT de até 300 ms, considerando a mediana de três execuções. O limite inicial de LCP acompanha a baseline atual de aproximadamente 3,1 s e deve ser reduzido gradualmente até a meta de 2,5 s. O Jenkins executa as verificações do frontend e o E2E integrado ao mock privado do GitLab.

### Pipeline Jenkins

Após importar o repositório para o GitLab, configure o job como **Pipeline from SCM**,
apontando para o repositório no GitLab e usando `Jenkinsfile` como **Script Path**. Ative a
integração Jenkins em **Settings > Integrations > Jenkins** no projeto GitLab para disparar
o job em pushes e merge requests.
Execute o job manualmente uma vez para registrar os gatilhos do `Jenkinsfile`. O plugin
GitLab publica os estados das etapas `quality`, `sonarqube`, `e2e`, `performance` e
`security` nos commits. O status geral `ci` só é aprovado após todas as etapas, inclusive
o Quality Gate. Nesse arranjo, o GitLab envia os eventos e o Jenkins executa o pipeline
definido neste repositório.

No Jenkins, configure a conexão GitLab com URL e token de API para publicar os status.
Configure separadamente as credenciais Git de leitura para este repositório e para o
`bttr-server`, usado no checkout do mock. A integração do GitLab aponta para o job Jenkins;
o pipeline é mantido no `Jenkinsfile`.

Após `Quality and unit tests` gerar o LCOV, a etapa **SonarQube Analysis** executa o
serviço `sonar-scanner` e publica o status `sonarqube` no GitLab. A etapa **Quality Gate**
aguarda o processamento por até 10 minutos e interrompe o pipeline se o gate não for
aprovado. As demais etapas E2E, performance e segurança só começam depois da aprovação.

O agente Jenkins precisa dos plugins Pipeline, GitLab e **SonarQube Scanner for
Jenkins**. Em **Manage Jenkins > System > SonarQube installations**, cadastre o servidor
com o nome exato `SonarQube Local` e associe uma credencial **Secret text** contendo o
token de análise. A URL precisa ser acessível pelo Jenkins e pelo contêiner
`sonar-scanner`; não use `localhost` quando Jenkins e SonarQube estiverem em contêineres
distintos.

Durante a análise, [`compose.jenkins.yaml`](compose.jenkins.yaml) conecta o serviço
`sonar-scanner` à rede externa `infraestrutura-network`. Defina
`CI_INFRASTRUCTURE_NETWORK` no agente se a infraestrutura usar outro nome. Para liberar a
etapa **Quality Gate**, configure no SonarQube um webhook para
`<URL_DO_JENKINS>/sonarqube-webhook/`, incluindo a barra final. O pipeline injeta URL e
token com `withSonarQubeEnv('SonarQube Local')`; o scanner vem da imagem oficial e não
precisa ser instalado globalmente no Jenkins.

## Build e publicação

```bash
npm run build
```

Os arquivos estáticos ficam em `dist/bttr/browser`. Sirva esse diretório e configure fallback das rotas do frontend para `index.html`.

O proxy do Angular CLI **não faz parte do build**. Em produção, configure um proxy reverso `/api/` para a API ou altere `dist/bttr/browser/config.json` para sua URL absoluta e ajuste CORS. A configuração pode ser alterada sem recompilar. Mantenha `config.json` sem cache persistente e preserve o roteamento dos recursos estáticos.

## Estrutura

- `src/app/core`: modelos, configuração, serviços HTTP, sessão e autorização.
- `src/app/shared`: layout, estados de tela, validações e cálculos compartilhados.
- `src/app/features`: páginas agrupadas por autenticação, perfil, habilidades e tempos.
- `e2e`: testes Playwright e simulação do contrato da API.
- `public`: configuração de execução e ícone da aplicação.

Referências técnicas: [compatibilidade do Angular](https://angular.dev/reference/versions), [instalação do PrimeNG](https://primeng.org/installation), [Jest Preset Angular](https://thymikee.github.io/jest-preset-angular/) e [Playwright](https://playwright.dev/docs/intro).
