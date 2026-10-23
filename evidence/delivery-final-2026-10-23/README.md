# Última validação pré-entrega · 23/10/2026

**300/300 E2E aprovados**, zero falhas, flaky, retries ou skips, em 15.69 minutos. Base c946d99; esta rodada não realizou commit, push ou deploy. [Relatório Playwright completo](playwright/index.html) · [Verificação e hashes](verification.json).

## Login: causa comprovada e correção

As referências [Desktop/Login](../../design-references/desktop/login-modal.png) e [Mobile/Login](../../design-references/mobile/login.png) mostram ícones Google/Facebook. A inspeção executada no build:demo, em 390×844, 768×1024 e 1440×1000, confirmou escala 1 (100%). Os botões já estavam no DOM, visíveis, desabilitados e com descrição acessível correta. No desktop/tablet, porém, os ícones tinham display:none e área 0×0; disabled:opacity-50 reduzia a opacidade dos botões para 0,5. Não foi um efeito exclusivo da escala da gravação.

Somente .login-dialog acima de 600px passou a exibir os mesmos assets locais, sem redução de opacidade, com tokens existentes de texto/borda. Google tem 20×20px e Facebook 10×20px, sem compressão. O atributo disabled, a descrição de indisponibilidade e o aviso visível desktop continuam presentes. Não há OAuth, clique fictício ou alteração nos handlers, campos, validações, guard, redirects, X/Escape e sessão.

A geometria dos botões é idêntica antes/depois em todos os estados inspecionados. As três capturas mobile são byte a byte idênticas. Cadastro não recebeu CSS novo; suas baselines permaneceram intactas. Formulários vazio, preenchido e com erro não tiveram overflow horizontal. Os diálogos continuam roláveis, inclusive nos cenários de altura reduzida da suíte.

| Largura | Antes | Depois | Validação de erro |
| --- | --- | --- | --- |
| 390 px | [Antes](captures/before-390.png) | [Depois](captures/after-390.png) | [Erro](captures/error-390.png) |
| 768 px | [Antes](captures/before-768.png) | [Depois](captures/after-768.png) | [Erro](captures/error-768.png) |
| 1440 px | [Antes](captures/before-1440.png) | [Depois](captures/after-1440.png) | [Erro](captures/error-1440.png) |

[Medições anteriores](before-inspection.json) · [Medições após correção e árvore acessível](after-inspection.json).

## Baselines inspecionadas

A primeira execução direcionada teve 32 aprovações e 4 falhas exclusivamente de imagem. Os quatro diffs foram abertos e inspecionados: mudanças restritas a ícones/textos/contraste dos dois botões sociais; formulário e fundo preservados. Foram copiadas somente essas quatro capturas reais para as baselines:

- tests/e2e/auth.spec.ts-snapshots/login-desktop-win32.png
- tests/e2e/cart.spec.ts-snapshots/login-autofill-desktop-win32.png
- tests/e2e/auth.spec.ts-snapshots/login-tablet-win32.png
- tests/e2e/cart.spec.ts-snapshots/login-autofill-tablet-win32.png

As outras 20 baselines mantiveram o hash anterior. [Hashes e justificativas](baseline-changes.json). Nenhum comando de atualização indiscriminada foi utilizado, e as asserções de autofill, foco e cores dos campos continuam intactas. Diffs e traces da rodada inicial permanecem locais; a execução final não teve falhas nem traces de falha a entregar.

## README e histórico

O [README principal](../../README.md) agora apresenta projeto, demo/código/Figma, credenciais e setup no início, seguidos de funcionalidades, stack, cenários reproduzíveis, testes, Lighthouse atual, arquitetura, limitações e índice de evidências. O histórico foi preservado em [docs/HISTORY.md](../../docs/HISTORY.md), com links relativos corrigidos. Explicações extensas de contratos/cache continuam em seus documentos próprios. Os resultados 99/100 desktop e 88/90 mobile permanecem explícitos; não foram substituídos pelas notas históricas.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| Typecheck, lint | Aprovados |
| Build de produção e build:demo | Aprovados; aviso de chunk >500KB permanece |
| Direcionados após revisão das baselines | 36 aprovados; 0 falhas; zero retries/skips |
| Primeira regressão integral, 3 workers | 299 aprovados; 1 falha de ambiente, preservada abaixo |
| Caso de isolamento após a falha de ambiente | 1 aprovado; 0 falhas; sem alterar o teste |
| Regressão integral final | 300 aprovados; 0 falhas; zero retries/skips |
| Anexos do HTML final | 58 referências verificadas; 0 ausentes; 0 traces |
| Instalação limpa adicional | Aprovada em pasta isolada, com npm ci e build:demo; verificação em verification.json |
| Reflow e foco adicional | 320×720 e 390×500; sem overflow horizontal ou foco encoberto; [dados](reflow-inspection.json) |

Comandos usados: npm.cmd run typecheck; npm.cmd run lint; npm.cmd run build; npm.cmd run build:demo. Direcionados: playwright test auth.spec.ts auth-close.spec.ts cart.spec.ts responsive.spec.ts --grep 'cadastro validado|cadastro: composição|Roboto Mono|login: composição|Login|autofill mantém|formulários e conta|falha de login' --retries=0 --workers=3. Regressão final: playwright test --retries=0 --workers=2, com E2E_PREVIEW=true e E2E_BASE_URL removida. Ambiente Windows/Node 24.14.1/Playwright 1.64.1/Chromium 156.0.8078.4; 100 testes por viewport. O HTML foi copiado com seus recursos originais, conferidos por SHA-256.

Na primeira regressão integral, Chromium retornou net::ERR_NO_BUFFER_SPACE no page.goto da preparação do teste de isolamento de perfil/carteiras, antes de carregar a aplicação. Durante a investigação posterior havia cerca de 754MiB de RAM física livre, sem processos de automação órfãos; a observação é compatível com pressão de recursos, mas não determina a causa exata. O teste não foi alterado nem recebeu retry/timeout maior. A suíte completa foi repetida com dois workers para reduzir concorrência. [Trace original](environment-failure/trace.zip), [erro/contexto original em ZIP](environment-failure/error-context.zip) e [diagnóstico](environment-failure/diagnostics.json) preservam o resultado desfavorável; a rodada inicial não foi apresentada como verde. O ZIP mantém os bytes do contexto gerado, incluindo sua formatação, sem normalizar o original.

Para abrir o trace: npx playwright show-trace evidence/delivery-final-2026-10-23/environment-failure/trace.zip. A seleção isolada inicial retornou No tests found por um filtro ancorado no título completo; o filtro foi corrigido sem alterar o teste, que então passou. O registro vazio não foi contado como execução aprovada.

Instalação adicional usa uma cópia isolada das fontes/configurações vigentes, sem node_modules anterior, com npm ci --offline --no-audit --no-fund e npm run build:demo. O cache local de pacotes foi reutilizado; isso não certifica uma transferência fria do registry. [Log da instalação](clean-install.txt) · [Log do build](clean-build.txt). Os bytes originais dos logs foram preservados, com extensão .txt para não serem excluídos pela regra *.log do Git. Avisos de deprecação das ferramentas foram preservados, sem atualizar dependências. O resultado e a comparação dos artefatos constam em verification.json.

## Pendências e decisão de publicação

**PRONTO COM RESSALVAS:** Home mobile Performance 88, abaixo da meta 90. Os [12 relatórios Lighthouse anteriores](../final-recovery-2026-10-23/README.md#lighthouse-oficial-final--12-medições) foram preservados. Não se repetiu Lighthouse porque a mudança é uma regra de apresentação exclusiva do Login, sem alteração de conteúdo/composição das páginas auditadas. O CSS compartilhado ganhou cerca de 0,19KB, sem nova fonte/dependência/asset. Não se apresenta uma nova nota Lighthouse desta rodada.

Reflow automatizado em viewport estreita não certifica zoom real de navegador nem tecnologias assistivas/aparelho físico. Carteiras/pagamentos continuam simulados. Antes da submissão, o responsável precisa publicar o commit final e validar o mesmo código na Vercel. Os novos relatórios só ficam públicos depois do push manual; os links das auditorias anteriores foram conferidos anonimamente. GitHub mostra o código dos HTML; use npx playwright show-report evidence/delivery-final-2026-10-23/playwright após clonar/baixar.

Lista exata para o commit: README.md, docs/HISTORY.md, src/styles.css, tests/e2e/auth.spec.ts, os quatro PNGs listados acima e esta pasta completa de evidências. Não incluir test-results, playwright-report, dist, node_modules ou arquivos env privados. Não houve mudança em package/lockfile, infraestrutura, catálogo, carrinho, checkout, contratos, MSW ou Socket.IO. O push pode acionar a integração da Vercel; mantenha build:demo e verifique rotas/worker/compra após publicar.

## Conferência final da entrega

- 95 links locais e 10 âncoras válidos; nenhum destino ausente ou ignorado. Os quatro links públicos examinados de Playwright/Lighthouse responderam HTTP 200.
- 70 arquivos de evidências, aproximadamente 12,4 MiB. HTML/anexos, capturas, logs e trace conferidos com os originais por SHA-256; nenhum relatório anterior foi sobrescrito.
- 78 arquivos no conjunto exato de commit: oito fontes/documentos/baselines e os 70 arquivos desta pasta. A lista completa está em verification.json, campo deliveryChecks.exactCommitFileList.
- git diff --check aprovado; nenhuma correspondência nos padrões de segredo examinados. Somente .env.demo/.env.example estão versionados; nenhum arquivo foi colocado no staging pelo agente.
- A nova documentação e estes relatórios ainda dependem do commit/push manual. Depois de publicar, confira os links e execute o smoke da URL final, conforme README. Não se declara que a versão pública já contenha este ajuste.

Comandos de seleção para o responsável executar manualmente, após revisar o diff:

```powershell
git add -- README.md docs/HISTORY.md src/styles.css tests/e2e/auth.spec.ts
git add -- tests/e2e/auth.spec.ts-snapshots/login-desktop-win32.png tests/e2e/auth.spec.ts-snapshots/login-tablet-win32.png
git add -- tests/e2e/cart.spec.ts-snapshots/login-autofill-desktop-win32.png tests/e2e/cart.spec.ts-snapshots/login-autofill-tablet-win32.png
git add -- evidence/delivery-final-2026-10-23
git diff --cached --stat
git diff --cached --check
```
