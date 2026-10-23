# Kurio · Etapas 1 a 8

Marketplace com catálogo/detalhe, autenticação simulada, favoritos, carrinho/cotação, perfil, gerenciamento de carteiras e compra até recibo. REST é interceptado por MSW; preços, disponibilidade e pedidos usam Socket.IO. Sem blockchain, extensões ou gateways reais.

Referências: [enunciado oficial](https://github.com/junglegaming/frontend-challenge), [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) e `LEIA-ME.md`. O enunciado prevalece. Nenhuma implementação de outro candidato foi consultada.

## Acesso rápido

**URL pública:** [kurio-frontend-challenge.vercel.app](https://kurio-frontend-challenge.vercel.app/). A entrega local da Etapa 8 não foi publicada automaticamente.

**Stack:** React 19, TypeScript, Vite, TanStack Router/Query, Axios, Tailwind, shadcn/ui, MSW e Socket.IO. APIs, autenticação, carteiras e compras são simuladas localmente; nenhum pagamento real é realizado.

### Instalar e executar

Requer Node >= 22.12 (validado com 24.14.1) e npm. Na raiz do repositório:

```sh
npm ci
npm run dev
```

Abra `http://127.0.0.1:5173`. Para executar o build de demonstração otimizado, com MSW habilitado por `.env.demo`:

```sh
npm run build:demo
npm run preview
```

Abra `http://127.0.0.1:4173`. Não são necessários segredos nem backend externo. No PowerShell com scripts bloqueados, use `npm.cmd`/`npx.cmd`.

### Credenciais fictícias e cenários

| Usuário | E-mail | Senha de demonstração |
| --- | --- | --- |
| Ana | `ana@kurio.test` | `KurioDemo!123` |
| Bruno | `bruno@kurio.test` | `KurioDemo!123` |

Em **Cenários de demonstração → Restaurar cenário**, retorne às fixtures padrão. Explore catálogo/filtros, favoritos, perfil/carteiras e carrinho → pagamento → pedido. **Alterar Emerald Ape** demonstra atualização via Socket.IO. Os cenários `empty`, `error`, `slow`, `variable`, `offline` e `timeout` exercitam estados da API; `success` recupera o fluxo. Sessão e dados persistem no navegador/origem, com isolamento entre usuários. Os contratos e demais cenários estão em [CONTRACTS.md](CONTRACTS.md).

### Evidências entregues

- [Correção dos favoritos do catálogo desktop/tablet: causa, comparação e testes](evidence/fix-card-favorites/README.md).
- [Revisão visual 06 · Detalhe mobile: comparação Figma/Antes/Depois, favorito e validação](evidence/visual-06-detalhe/README.md). Geometria da galeria preservada, desktop/tablet idênticos e **54 testes direcionados aprovados**.
- [Revisão estrutural 05 · Home: divergências, capturas completas e validação](evidence/visual-05-home/README.md) e [comparação visual desktop/mobile](evidence/visual-05-home/index.html). Banners, prévias editoriais, informações/newsletter e rodapé exclusivos da Home; serviços futuros explicitamente indisponíveis. Regressão desta revisão: **276 testes aprovados**.
- [Índice navegável no GitHub](evidence/etapa8/README.md) e [índice HTML local](evidence/etapa8/index.html).
- [12 medições finais Lighthouse: HTML/JSON](evidence/etapa8/README.md#as-12-medicoes-finais), [medianas](evidence/etapa8/lighthouse/summary.json) e [configurações efetivas/MSW/Socket.IO](evidence/etapa8/lighthouse/runs.json).
- [Playwright definitivo: 249 testes aprovados](evidence/etapa8/playwright/index.html), com todos os anexos necessários em `data/`, sem traces de falhas anteriores.

O GitHub exibe o código dos HTML; clone/baixe o repositório para abri-los. Lighthouse é independente por arquivo. Para navegar no relatório Playwright: `npx playwright show-report evidence/etapa8/playwright`. A pasta `evidence/etapa8/` é versionável; os diretórios de trabalho `.lighthouseci/`, `playwright-report/` e `test-results/` continuam ignorados. Relatórios/capturas históricos citados abaixo como caminhos em código são registros locais, não arquivos publicados no GitHub. Apenas a rodada final e dois pequenos registros complementares foram preparados para entrega.

## Lighthouse e otimização · Etapa 8

Auditoria realizada no **build de demonstração**, com MSW, REST, Socket.IO, imagens e fontes do projeto ativos. Comparação usa 12 medições iniciais e 12 finais: três execuções independentes por página/perfil, sempre em um novo perfil Chromium. Também foram preservadas duas rodadas intermediárias de 12, sem escolher as melhores execuções para compor as medianas. Todas as metas foram atingidas na rodada definitiva.

### Medianas antes → depois

| Página/perfil | Performance ≥ 90 | Accessibility ≥ 95 | Best Practices ≥ 95 | SEO ≥ 90 |
| --- | --- | --- | --- | --- |
| Home desktop | 100 → **100** | 99 → **100** | 96 → **100** | 92 → **100** |
| Detalhe desktop | 99 → **100** | 99 → **100** | 96 → **100** | 92 → **100** |
| Home mobile | 90 → **92** | 99 → **100** | 93 → **100** | 92 → **100** |
| Detalhe mobile | 89 → **92** | 99 → **100** | 96 → **100** | 92 → **100** |

| Página/perfil | LCP (ms) antes → depois | CLS antes → depois | TBT (ms) antes → depois |
| --- | --- | --- | --- |
| Home desktop | 735,9 → **647,1** | 0,010748 → **0,009312** | 23 → **18** |
| Detalhe desktop | 745,2 → **701,3** | 0,060615 → **0** | 14,5 → **16** |
| Home mobile | 2695,4 → **2661,0** | 0,000415 → **0,000415** | 286,0 → **209,5** |
| Detalhe mobile | 2944,4 → **2758,8** | 0 → **0** | 252 → **208** |

Medianas calculadas separadamente para cada categoria e métrica; dados sem arredondamento em [antes](evidence/etapa8/baseline-summary.json) e [depois](evidence/etapa8/lighthouse/summary.json). O **[índice da entrega](evidence/etapa8/README.md)** reúne os HTML/JSON originais das **12 medições finais**, [configurações e verificações por execução](evidence/etapa8/lighthouse/runs.json). Cada combinação tem três relatórios `home|detail-desktop|mobile-1|2|3.html` e `.json`. Os relatórios incluem as imagens capturadas pelo próprio Lighthouse.

As 48 medições válidas e o índice completo original continuam preservados localmente em `.lighthouseci/`, fora do Git. Não se duplicam nesta entrega rodadas intermediárias, capturas externas ou evidências por execução já reunidas em `runs.json`. As imagens locais `-measured.webp` foram extraídas da captura nativa; `-loaded.png` são verificações posteriores à restauração da emulação e não representam o viewport medido.

### Diagnóstico e mudanças

- A análise inicial identificou favicon 404, `/robots.txt` recebendo HTML da SPA, alt redundante e nome acessível que omitia o badge. Bootstrap e MSW concentravam execução de script; havia 569 nós no catálogo, 393 no detalhe e quatro PNGs somando 1.582.736 bytes. O CLS desktop do detalhe foi atribuído pelo Lighthouse ao rodapé que aparecia durante o carregamento.
- `src/app/router.tsx`: componentes de autenticação, favoritos, carrinho, pagamento, pedidos, perfil e carteiras carregam sob demanda pelo TanStack Router. Guards e contratos anteriores permanecem. `src/app/shell.tsx` preserva o redirect se Entrar for acionado novamente durante o carregamento de login/cadastro.
- `src/components/nft-card.tsx` e `src/mocks/controls.tsx`: painéis fechados montam seu conteúdo na primeira abertura e o conservam depois, incluindo quantidades, edições e cenários selecionados. Não se removem ações; os testes abrem, alteram, fecham e reabrem os painéis. DOM inicial caiu para 382 nós no catálogo e 260 no detalhe.
- `src/components/loading.tsx`: skeleton reserva informações e relacionados, evitando o deslocamento do rodapé. Shimmer/reduced motion e composição final permanecem. Nenhuma baseline visual foi atualizada nesta etapa.
- Quatro variantes WebP **lossless**, 500×500, somam **869.456 bytes**, redução de **45,1%**. Igualdade de todos os pixels RGBA foi verificada com Pillow 11.1.0; [registro](evidence/etapa8/image-optimization.json). PNGs originais/contrato REST foram preservados. `src/lib/nft-image.ts`, cards, galeria e hero selecionam variantes locais via srcset; imagens arbitrárias não são reescritas. Imagens principais têm prioridade alta e a imagem secundária do hero, oculta no desktop, é lazy. `public/favicon.png` foi reduzido a 64×64 a partir do asset Emerald original.
- `src/lib/page-metadata.ts`, catálogo e detalhe atualizam/restauram título e descrição. `public/robots.txt` e o favicon referenciado em `index.html` eliminam respostas incorretas/erros. Alt e nome acessível dos cards foram corrigidos sem alterar sua aparência.
- Bootstrap caiu de **536,84 kB / 172,07 kB gzip** para **496,93 kB / 161,72 kB gzip**, eliminando o aviso acima de 500 kB por separação real de código. Soma dos recursos JavaScript observados em cada página pública: **895.316 → 855.792 bytes descomprimidos**. Não se atribuiu a performance apenas ao tamanho do bundle: houve diagnóstico de execução de script, DOM, imagens e CLS.
- `scripts/lighthouse.mjs` e `package.json` implementam coleta, verificações, medianas e índice HTML usando Lighthouse/LHCI e Playwright já instalados. `tests/e2e/optimization.spec.ts` adiciona nove execuções (três cenários × três larguras) para os recursos alterados. Decisões e limites em [ARCHITECTURE.md](ARCHITECTURE.md).

As variantes podem ser regeneradas a partir dos PNGs com Pillow 11.1.0: `Image.open(p).convert('RGBA').save(p.with_suffix('.webp'), format='WEBP', lossless=True, quality=100, method=6, exact=True)`. Compare dimensões e `tobytes()` de ambos em RGBA antes de substituir. O favicon usa thumbnail 64×64 com `Image.Resampling.LANCZOS` e PNG otimizado. Python/Pillow são necessários somente para regenerar assets; checkout limpo/build usa os arquivos entregues, sem dependência nova no projeto.

### Ambiente, reprodução e limites

Node **24.14.1**, Chromium **156.0.8078.4** (Playwright 1.64.1), Lighthouse **12.6.1**, LHCI **0.15.1**. Windows NT **10.0.26200 x64**, Intel i5-10400F 2,90 GHz, 12 processadores lógicos e 16 GiB de RAM. Headless Chrome, sem extensões/perfil pessoal. Auditado em `http://127.0.0.1:4174/` e `/nfts/emerald-ape-042`, Vite preview HTTP local. Sem testes Playwright concorrentes durante medições.

Perfis padrão do Lighthouse 12, `throttlingMethod=simulate`: desktop 1350×940/DPR 1, RTT 40 ms, throughput 10.240 Kbps e CPU 1×; mobile 412×823/DPR 1,75, RTT 150 ms, throughput 1.638,4 Kbps e CPU 4×. São simulações Lantern, não rede/CPU de um aparelho físico. Configurações completas e benchmarkIndex por execução estão nos JSONs/evidências. Fontes continuam de sistema (`Consolas`, `Liberation Mono`, `Courier New`), sem downloads de webfonts. Fixture padrão: Emerald 1,19 ETH/v1 e 12 NFTs; cache/storage inicialmente frios em cada processo, sem alterações/usuário herdados de outra medição.

O runner **não prepara uma página aquecida**. Depois da coleta verifica controlador do service worker, REST efetivamente interceptada, fixture, imagens visíveis carregadas, fontes prontas e status Ao vivo. Só então dispara um update via REST/MSW e aguarda a recepção pelo Socket.IO Client, fora da janela medida, descartando o perfil ao terminar. Nada disso desativa funcionalidades ou muda cenários durante a auditoria.

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run build:demo
Remove-Item Env:LH_PROFILE -ErrorAction SilentlyContinue
npm.cmd run audit -- before
# Após aplicar as alterações que deseja comparar:
npm.cmd run build:demo
npm.cmd run audit -- final
# Regerar apenas o índice, sem novas medições:
npm.cmd run audit -- report
```

`npm.cmd run audit` equivale à rodada final completa. `LH_PROFILE=desktop` ou `mobile` limita a seis auditorias; deixe a variável ausente para as 12. `CHROME_PATH` permite outro executável, cuja versão ficará registrada; o padrão é o Chromium instalado pelo Playwright. `lighthouserc.cjs` fornece URLs, quantidade, categorias e metas; o runner seleciona o preset correspondente e não ignora audits dessas categorias. Falha de runtime/conteúdo interrompe a rodada, sem inventar medianas. Relatórios ficam em `.lighthouseci/`, ignorados pelo Git e fora de `dist`.

A primeira tentativa de preparação perdeu a aba após Lighthouse fechá-la; foi preservada em `.lighthouseci/setup-failure/` e excluída das medianas por não completar a verificação das integrações. A implementação passou a fornecer uma aba Puppeteer mantida aberta, conectando Playwright apenas depois da coleta. Import paralelo da aplicação foi descartado porque o cliente Socket.IO podia capturar WebSocket antes do interceptor; a ordem original de `worker.start` foi mantida. As rodadas intermediárias de modulepreload e ajuste de layout foram preservadas no índice local, fora da entrega versionada. Modulepreload piorou o LCP simulado e não mostrou ganho local consistente; foi retirado. A regressão também identificou perda de redirect por clique redundante no header durante o carregamento da autenticação, corrigida antes da rodada definitiva.

**Limites:** respostas/recursos que atravessam o service worker podem aparecer com `transferSize=0` no CDP mesmo com `resourceSize` não zero. Na tentativa de modulepreload, o bootstrap passou de transferência opaca para contabilizada, alterando a previsão Lantern; por isso foram mantidos os relatórios intermediários e a mesma sequência de carregamento no comparativo definitivo. Bytes de arquivos, resourceSize e verificação visual foram analisados separadamente. As notas locais não comprovam performance de rede móvel real, DNS/TLS/CDN/Vercel; existe variação de carga/frequência do host. LCP mobile permanece perto de 2,7s e o MSW obrigatório conserva custo de execução. Metadados são atualizados no cliente, sem SSR. Lighthouse não substitui revisão manual de acessibilidade nem auditoria completa de segurança. A URL pública não foi atualizada ou medida nesta etapa; nenhum commit, deploy ou revisão final geral foi realizado.

### Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado; repetido pelo build definitivo |
| `npm.cmd run lint` | Aprovado, incluindo o runner/gerador de relatórios |
| `npm.cmd run build:demo` | Aprovado, 558 módulos; maior chunk 496,93 kB, sem aviso acima de 500 kB |
| `npm.cmd run audit -- before` / `npm.cmd run audit -- final` | 12 medições válidas por rodada; todas as metas finais atingidas; 24 medições intermediárias preservadas |
| `npm.cmd run audit -- report` | Índice HTML e capturas nativas extraídas dos LHRs, sem novas medições |
| `npx.cmd playwright test optimization.spec.ts foundation.spec.ts --grep 'produção:\|rotas carregadas\|painéis sob demanda\|catálogo: REST\|Socket.IO: evento real\|cenários:' --output=test-results/etapa8-otimizacoes` | **18 aprovados em 40,9s** |
| `npx.cmd playwright test checkout.spec.ts --project=desktop --max-failures=1 --output=test-results/etapa8-checkout` | **18 aprovados em 53,5s**, após corrigir o clique redundante em Entrar |
| `npx.cmd playwright test --max-failures=1 --output=test-results/etapa8-final` | **249 aprovados em 8,5min**, 83 por viewport, sem ignorados/flaky e sem atualizar baselines |
| `git diff --check` | Aprovado |

Playwright usou `$env:E2E_PREVIEW='true'` e `$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/NOME-DA-RODADA'`, correspondendo ao nome após `test-results/`. Relatórios: [249 testes no build definitivo](evidence/etapa8/playwright/index.html), otimizações direcionadas (local: `playwright-report/etapa8-otimizacoes/index.html`) e checkout (local: `playwright-report/etapa8-checkout/index.html`). A regressão completa anterior foi interrompida ao revelar a perda do redirect; não é apresentada como aprovação. A rodada definitiva passou nos 240 testes anteriores e nos nove novos, preservando filtros/URL/slider, precisão ETH, autenticação/isolamento, favoritos/rollback, perfil/carteiras, carrinho, cupons, compra, pedidos idempotentes, sockets, loading/teclado e refresh/acesso direto de rotas internas.

## Ajustes visuais e responsividade · Etapa 7

Referências: terceira/quarta imagens identificadas pelo usuário como Figma e frames locais em `design-references/`. As outras imagens são exemplos dos problemas. Ajustes localizados em `src/styles.css`, `src/components/filter-group.tsx` e `src/app/shell.tsx`; `index.html` habilita `viewport-fit=cover` e CSS reserva também a área segura superior. Metadados tipados em `src/api/contracts.ts`/`src/mocks/handlers.ts` e cobertura em `tests/e2e/responsive.spec.ts`. Sem dependências, commits, deploy ou Lighthouse.

No mobile, os cards do catálogo/favoritos deixam de deslocar a coluna par; imagens quadradas e espaço para títulos de duas linhas alinham preços/ações por linha. O coração recebe padding zero para não colapsar o SVG e o hover ilustrativo de zoom não permanece após touch. O Figma mantém colunas escalonadas; aqui prevalece a solicitação explícita de dimensões/alinhamento uniformes. Assets, cores, fontes e desktop existentes são preservados.

A navegação inferior mantém a composição do Figma, com altura e espaço final que incluem `safe-area-inset-bottom`. Foco em controles do conteúdo mobile ajusta a rolagem acima da barra/scanner e considera o viewport visual; formulários podem ser percorridos até suas ações finais. Menu da conta tem largura/altura limitadas e rolagem. Títulos e ações de carteiras quebram linha sem overflow. A barra continua fixa: conteúdo fora da área visível é alcançado rolando; capturas de página inteira representam a barra na posição do viewport inicial.

O painel de filtros separa header, corpo rolável e rodapé com **Ver resultados** sempre acessível. Mantém foco modal, Escape, retorno ao acionador e bloqueio de fundo. Redimensionamento/teclado virtual ajusta a altura ao `visualViewport`; ResizeObserver mantém o controle focado dentro do corpo rolável. A faixa usa dois ranges nativos sobrepostos, com thumb arrastável por touch/mouse, setas/Home/End e valores ETH anunciados. **Aplicar** continua sendo a confirmação para a URL/REST; campos exatos e validações anteriores permanecem.

GET `/api/nfts/filters` acrescenta `priceRange:{min,max}` em strings ETH, derivado da fonte compartilhada. Não muda regras de filtragem, autenticação ou compra. O slider usa coordenadas inteiras e wei/BigInt: passo de 0,01 ETH para faixas até 100 ETH; acima disso, 1.000 posições; endpoint final exato e faixa abaixo de 0,01 ETH com endpoints. Valores digitados/recebidos com 18 casas não são arredondados por renderizar o slider. Extremos aplicados fora da faixa atual ampliam seu domínio; os controles não cruzam entre si. Number é usado apenas nas coordenadas limitadas de apresentação.

### Baselines revisadas individualmente

A comparação anterior à atualização executou 15 testes: dez passaram e cinco apontaram diferenças esperadas, revisadas pelas imagens atuais/diffs:

| Baseline | Justificativa |
| --- | --- |
| `foundation.spec.ts-snapshots/catalog-desktop-win32.png` | Apenas slider/legenda na sidebar e deslocamento dos controles abaixo dele |
| `foundation.spec.ts-snapshots/catalog-tablet-win32.png` | Mesmo slider na sidebar estreita; grid/hero preservados |
| `foundation.spec.ts-snapshots/catalog-mobile-win32.png` | Cards alinhados, corações visíveis, hover touch removido e reserva inferior |
| `cart.spec.ts-snapshots/login-autofill-tablet-win32.png` | Slider visível no fundo do catálogo; modal/autofill preservados |
| `cart.spec.ts-snapshots/cart-mobile-win32.png` | Reserva inferior da navegação; linhas, valores e resumo preservados |

As demais baselines não devem ser regeneradas. A altura dos títulos foi limitada ao catálogo/favoritos para preservar os cards relacionados do detalhe/carrinho. A primeira rodada nova passou em 14/15 verificações; o caso de viewport reduzido revelou um controle já focado fora do corpo visível, corrigido com o observador de tamanho e espera pela recomposição no teste.

Diferenças remanescentes: fonte/cores continuam nos tokens provisórios existentes; nomes, preços, ordem e repetições de edições vêm da API, diferindo dos exemplos do Figma. Coleções/raridade/disponibilidade reais substituem categorias/redes sem contrato. Campos exatos de ETH, sort, contador e ações de compra continuam visíveis para preservar as funcionalidades. O escalonamento do Figma foi removido conforme a prioridade de alinhamento. Touch/teclado/resize foram exercitados no Chromium; teclado virtual e recorte físico em Safari/iOS ainda pedem conferência em aparelho real. O aviso de chunk principal acima de 500 kB continua fora do escopo de Lighthouse.

### Validação e capturas da Etapa 7

| Comando | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado; também executado pelo build final |
| `npm.cmd run lint` | Aprovado após os últimos ajustes |
| `npm.cmd run build:demo` | Aprovado; MSW/Socket.IO preservados; chunk principal 536,84 kB / 172,07 kB gzip, com aviso de tamanho |
| `npx.cmd playwright test --grep 'drawer e sidebar\|layout de conta' --output=test-results/etapa7-antes` | **6 aprovados em 18,1s**, registro anterior às alterações |
| `npx.cmd playwright test --grep 'catálogo: REST\|autofill mantém\|layout responsivo, navegação' --update-snapshots=changed --output=test-results/etapa7-baselines` | **9 aprovados em 30,4s**; somente as cinco baselines justificadas acima mudaram |
| `npx.cmd playwright test --output=test-results/etapa7` | **240 aprovados em 8,9min**, sem atualizar snapshots; 228 anteriores + 12 novos (quatro cenários × três larguras) |
| `npx.cmd playwright test responsive.spec.ts catalog.spec.ts foundation.spec.ts --grep 'cards alinhados\|slider duplo\|painel rolável\|formulários e conta\|drawer e sidebar\|catálogo: REST' --output=test-results/etapa7-final` | **18 aprovados em 35,0s**, após correções finais de largura dos links da conta, quebra de preços longos e safe area; sem atualizar snapshots |
| `git diff --check` | Aprovado |

Todos os testes usaram preview de produção local com `$env:E2E_PREVIEW='true'`. Cada rodada definiu `$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/NOME-DA-RODADA'`, conforme o nome em `--output`. Relatórios: antes (local: `playwright-report/etapa7-antes/index.html`), comparação sem atualização (local: `playwright-report/etapa7-comparacao/index.html`), baselines revisadas (local: `playwright-report/etapa7-baselines/index.html`), 240 testes (local: `playwright-report/etapa7/index.html`) e 18 verificações finais (local: `playwright-report/etapa7-final/index.html`). Nenhum teste ignorado ou flaky nas duas últimas rodadas. A suite completa cobre filtros, REST/MSW, cache/URL, autenticação/isolamento, favoritos/rollback, perfil/carteiras, carrinho/cupons, checkout/pedidos idempotentes, sockets e acesso direto. A rodada final reforça mouse/touch/teclado, não cruzamento dos controles, 18 casas após refresh, preço longo sem overflow, foco, painel de 390×600, menu e comparação do catálogo/detalhe.

Capturas comparativas com os mesmos dados de demonstração e, no catálogo, a mesma combinação aplicada (`collections=Kurio Studio`, mínimo 1,2 ETH). Inspeção visual comparou imagens atuais, diffs e os frames fornecidos; imagens de perfil/carteiras desktop e tablet permaneceram idênticas às anteriores. Artefatos locais ignorados pelo Git:

| Tela | Antes | Depois |
| --- | --- | --- |
| Catálogo · 390px | Captura (local: `playwright-report/etapa7-antes/data/8b63d5d149eee201ada40629bc7e11719aaee4f4.png`) | Captura (local: `playwright-report/etapa7-final/data/6ddbf3e1fa63edd08fe60389f515c58d6bc49c39.png`) |
| Catálogo · 768px | Captura (local: `playwright-report/etapa7-antes/data/1ba00197cb98e1642566589e1bced060d8a5bc16.png`) | Captura (local: `playwright-report/etapa7-final/data/5a6fcfadb7e194c43723003251fa35de6405de15.png`) |
| Catálogo · 1440px | Captura (local: `playwright-report/etapa7-antes/data/6708fecee888fafa0a3242e3fff71c54d07d6736.png`) | Captura (local: `playwright-report/etapa7-final/data/146ca075150dd12d2e3ce8edb1dd629e16a706b1.png`) |
| Painel · 390px | Captura (local: `playwright-report/etapa7-antes/data/bf37be358a2568be02ee62104d9bfda2445089d8.png`) | Captura (local: `playwright-report/etapa7-final/data/74dfd8af373c48954959d1f5f30a249e93e9d3fa.png`) |
| Perfil · 390px | Captura (local: `playwright-report/etapa7-antes/data/fc801f0169578509f09f27e203e61805a84ffa0a.png`) | Captura (local: `playwright-report/etapa7-final/data/b09cdc82463a6e4258135ac33d95936115bc6ec1.png`) |
| Carteiras · 390px | Captura (local: `playwright-report/etapa7-antes/data/b515861c14bcfcd21e49d22b5ba3b63edc1bf362.png`) | Captura (local: `playwright-report/etapa7-final/data/8571b879b2ac4719846eb807b2a4cfaed5a8be92.png`) |

Capturas do viewport: cards mobile sem filtros (local: `playwright-report/etapa7-final/data/f17bffca1480f16ee762830c5895c4fd2faa3b46.png`), painel com ação inferior (local: `playwright-report/etapa7-final/data/315f90b1cf00671068fd31f58d911b35a8537caa.png`), ações finais de carteiras acima da barra (local: `playwright-report/etapa7-final/data/87cc3317666c73b5710963af30d2f94bf0a57d6f.png`) e menu da conta (local: `playwright-report/etapa7-final/data/fddd097f16797d88fdca7143a362d2f391edae72.png`). A publicação pública não foi alterada.

## Catálogo e filtros combinados · Etapa 6

A sidebar desktop e o botão de filtros mobile agora usam as coleções/raridades reais da API, disponibilidade e limites de preço ETH. Filtros de um mesmo grupo usam união; grupos, busca e preço são combinados por interseção no MSW, antes de contar/ordenar/paginar. Não foram criadas categorias ou redes por NFT nem alteradas fixtures para preencher o Figma.

Estado pertence à URL: `q`, `page`, `sort`, `collections`, `rarities`, `minPrice`, `maxPrice`, `availability`. Coleções/raridades múltiplas são CSV, `availability=available|sold-out`, e preço usa limite inclusivo com precisão de 18 casas. Exemplo: `/?q=Emerald&collections=Kurio+Studio&rarities=raro&minPrice=1.19&maxPrice=1.19&availability=available`. Defaults podem ser omitidos; preços continuam strings em todo o caminho, inclusive ao ler um link direto. Contrato/normalização detalhados em [CONTRACTS.md](CONTRACTS.md#catálogo-e-url--etapa-6).

Buscar, alterar filtro ou ordenação volta à primeira página. Refresh/histórico restauram campos, seleções e resultados. **Limpar tudo** restaura o catálogo padrão. Faixa inválida é indicada nos campos e não altera a URL; Aplicar aceita vírgula decimal e envia ponto. Preços desatualizados/estoque seguem a mesma reconciliação Socket.IO/REST da jornada de compra. Página além da última oferece retorno à primeira mantendo filtros.

No mobile, **Abrir filtros** abre dialog com scroll próprio, bloqueio do fundo, ciclo de teclado e Escape; **Ver resultados** fecha e restaura foco. Seleções e preços ainda não aplicados sobrevivem ao fechamento. Skeletons respeitam reduced motion; loading, atualização, erro HTTP/offline e recuperação permanecem acessíveis. Os metadados vêm de GET `/api/nfts/filters`; GET `/api/nfts` recebe e aplica todos os parâmetros.

Arquivos novos: `src/app/search.ts`, `src/features/catalog/search.ts`, `tests/e2e/catalog.spec.ts`. Alterados: contratos, router/shell, catálogo/queries, contexto visual de auth, `filter-group.tsx`, handlers MSW, CSS e esperas de metadados nos testes foundation/autofill. Decisões em [ARCHITECTURE.md](ARCHITECTURE.md#catálogo-e-filtros--etapa-6). Sem dependências, commits, deploy ou avanço para Lighthouse/auditoria/polimento geral.

Baselines: a comparação inicial isolada passou em quatro testes e identificou cinco capturas esperadamente diferentes. Foram revistas e atualizadas somente `catalog-{desktop,tablet,mobile}-win32.png` e `login-autofill-{desktop,tablet}-win32.png`: sidebar real, botão ativo e contador mobile. Login/cadastro sobre detalhe e login mobile passaram sem atualização; demais telas continuam sob regressão. As esperas adicionadas confirmam metadados carregados antes de fotografar. A primeira comparação compartilhou indevidamente o dev server de outra rodada; foi descartada e repetida no preview isolado. A correção do ciclo de foco do drawer foi confirmada; outros ajustes iniciais dos testes corrigiram contagem de raridade da fixture e espera assíncrona da ordenação.

Diferenças visuais para etapa futura: fonte/cores provisórias, dados/coleções distintos dos exemplos do Figma e ausência de categoria/rede no modelo. O slider ilustrativo foi substituído por limites digitáveis para preservar precisão. Hero, cards, assets e grid existentes não foram redesenhados. Em capturas de página inteira mobile, a navegação fixa aparece na posição do viewport inicial; na aplicação ela acompanha a rolagem, e o drawer fica acima dela na camada modal.

### Validação e capturas da Etapa 6

| Comando no PowerShell | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado; também executado pelo build final |
| `npm.cmd run lint` | Aprovado |
| `npm.cmd run build:demo` | Aprovado; chunk principal 534,21 kB / 171,16 kB gzip, com aviso de tamanho |
| `$env:E2E_PREVIEW='true'; $env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/etapa6'; npx.cmd playwright test --output=test-results/etapa6` | **228 aprovados em 7,8min**, sem atualizar snapshots |
| `$env:E2E_PREVIEW='true'; $env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/etapa6-final'; npx.cmd playwright test catalog.spec.ts --grep 'drawer e sidebar' --output=test-results/etapa6-final` | **3 aprovados em 7,2s**, após o ajuste pontual do botão de fechar; inclui geometria do foco, teclado e capturas |
| `git diff --check` | Aprovado |

A regressão reúne 48 execuções novas (16 cenários × 3 larguras) e as 180 anteriores. Cobre filtros combinados/REST, precisão de 18 casas, ordenação estável, paginação/contagem, refresh/link compartilhado/histórico, URL inválida, cancelamento de resposta antiga, erro/offline/recuperação, loading/reduced motion, teclado e reconciliação Socket.IO com preço/estoque/duplicatas. Autenticação, favoritos, perfil, carteiras e jornada de compra continuam aprovados. Nenhum teste foi ignorado ou flaky.

A atualização explícita das cinco baselines justificadas acima usou `npx.cmd playwright test --grep 'catálogo: REST|autofill mantém' --update-snapshots=changed --output=test-results/etapa6-baselines`, com `E2E_PREVIEW=true` e `PLAYWRIGHT_HTML_OUTPUT_DIR=playwright-report/etapa6-baselines`: **6 aprovados em 15,7s**. A suíte completa posterior apenas comparou essas imagens.

Relatórios locais: regressão completa (local: `playwright-report/etapa6/index.html`), verificação final do painel (local: `playwright-report/etapa6-final/index.html`) e baselines revisadas (local: `playwright-report/etapa6-baselines/index.html`). Capturas reais, comparadas com as referências locais:

| Largura | Catálogo filtrado |
| --- | --- |
| 390px | Captura mobile (local: `playwright-report/etapa6-final/data/8b63d5d149eee201ada40629bc7e11719aaee4f4.png`) |
| 768px | Captura tablet (local: `playwright-report/etapa6-final/data/1ba00197cb98e1642566589e1bced060d8a5bc16.png`) |
| 1440px | Captura desktop (local: `playwright-report/etapa6-final/data/6708fecee888fafa0a3242e3fff71c54d07d6736.png`) |

Drawer mobile com foco visível (local: `playwright-report/etapa6-final/data/bf37be358a2568be02ee62104d9bfda2445089d8.png`). Os relatórios/capturas são artefatos locais ignorados pelo Git. Esta etapa não publicou uma nova versão; os resultados correspondem ao preview de produção local.

## Perfil e gerenciamento de carteiras · Etapa 5B

Entre como Ana/Bruno e abra o nome do usuário no header desktop ou **Conta → Meu perfil/Carteiras** no mobile. `/perfil` e `/carteiras` exigem sessão e retornam à rota original após login. A sidebar também permite alternar telas e abrir favoritos; itens editoriais continuam indisponíveis.

No perfil, edite nome de exibição, username, e-mail, ENS opcional e apelido público. **Alterar** seleciona um avatar PNG/JPEG/WebP de até 512 KiB; **Remover** prepara sua exclusão. A imagem fica em preview até **Salvar**. Senha só muda quando os três campos estão preenchidos e válidos. O mesmo Salvar confirma dados, avatar e senha em conjunto: senha atual incorreta, conflito ou erro não deixam alterações parciais. E-mail/username têm unicidade no MSW. Edições desatualizadas exigem **Recarregar dados**; isso descarta a edição local em favor do perfil atual. Nome/e-mail da sessão são atualizados sem logout, troca de identidade ou limpeza do carrinho/favoritos.

Em Carteiras, edite a principal ou use **Adicionar**/**Adicionar secundária**. A lista permite editar/promover as secundárias; a anterior passa a secundária. Endereço `0x` exige 40 caracteres hexadecimais ou ENS `.eth`; duplicata de endereço/rede é recusada. Metadados opcionais do frame são persistidos e validados. Alterações aparecem no checkout, que usa o mesmo hook/contrato/fonte. Mudar endereço/rede exige reconectar a carteira; editar apelido não desconecta. Pedidos anteriores conservam seus snapshots. O apelido público do perfil é independente dos apelidos dessas carteiras.

Para falhas, em **Cenários de demonstração → Sessão e favoritos**, selecione `account-error`: consultas/mutations de perfil e carteiras retornam 503. `success` recupera; os valores digitados permanecem após falha de mutation. `private-slow`/`mutation-slow` aplicam latência também a esses recursos. **Expirar sessão** reencaminha ao login; a API também reautoriza após a espera e operações assíncronas. Dados privados usam chaves por usuário/sessão e são cancelados/limpos na troca como nas etapas anteriores. **Restaurar cenário** remove alterações de perfil/avatar/senha/carteiras e restaura as duas contas originais.

Arquivos novos: `src/features/profile/{layout,page,wallets-page,queries,validation}`, `src/mocks/profile-handlers.ts` e `tests/e2e/account.spec.ts`. Arquivos estendidos: contratos, autenticação/store/handlers/cenários, `WalletForm`/`useWallets`/validação do checkout, `order-store`/handlers de carteira, router/shell/ícones/CSS/controles e teste de fallback de deploy. Não foram adicionadas dependências, serviços privados ou commits. Decisões e contratos completos estão em [ARCHITECTURE.md](ARCHITECTURE.md) e [CONTRACTS.md](CONTRACTS.md).

Limitações: dados de demonstração persistem no storage da origem, sem backend; avatar utiliza data URL e recusa gravação se o storage não puder persistir. Tokens existentes mantêm sua validade original após troca de senha. Metadados/ENS/indicação opcionais evitam exigir dados blockchain fictícios. Fonte/cores continuam provisórias; o placeholder de avatar reutiliza o ícone local. Desktop segue os frames locais, tablet/mobile empilham formulários e compactam navegação; dados preenchidos e carteiras existentes diferem dos frames vazios. Rodapé/controles de demonstração anteriores foram preservados.

Registro da Etapa 5B: o usuário havia informado publicação pública validada com seis testes após a Etapa 5A. As alterações daquela etapa foram verificadas no preview local, sem nova publicação pelo agente. Filtros e Lighthouse ainda não faziam parte daquela execução; seus resultados posteriores estão nas seções das Etapas 6 e 8.

### Validação e capturas da Etapa 5B

| Comando no PowerShell | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado; repetido pelo build final |
| `npm.cmd run lint` | Aprovado após os ajustes finais |
| `npm.cmd run build:demo` | Aprovado, MSW e Socket.IO preservados; chunk principal 530,45 kB / 169,70 kB gzip, com aviso de tamanho |
| `$env:E2E_PREVIEW='true'; $env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/etapa5b'; npx.cmd playwright test --output=test-results/etapa5b` | **180 aprovados em 6,7min**, sem atualizar snapshots; 60 por viewport |
| `$env:E2E_PREVIEW='true'; $env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/etapa5b-final'; npx.cmd playwright test --grep 'layout de conta\|perfil editado persiste\|validação cliente/MSW\|autofill mantém' --output=test-results/etapa5b-final` | **12 aprovados em 27,9s** após estender a correção de autofill ao perfil; pseudo-classe real do Chromium via CDP |
| `$env:E2E_PREVIEW='true'; $env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/etapa5b-carteiras'; npx.cmd playwright test --grep 'carteiras: cadastro\|layout de conta\|carteiras: validação' --output=test-results/etapa5b-carteiras` | **9 aprovados em 33,7s** após isolar erros por formulário; inclui carteira do checkout anterior e autofill/capturas nos três tamanhos |
| `git diff --check` | Aprovado |

A suíte completa reúne 36 execuções novas (12 cenários × 3 larguras) e as 144 anteriores. Cobre acesso protegido/retorno, perfil/sessão/cache/persistência, conflitos/versão, troca de senha atômica, avatar/tamanho/tipo/conteúdo, carteira/edição/promoção/duplicata, checkout/conexão invalidada, snapshot de pedido, autorização Ana/Bruno, expiração durante mutation, falha/recuperação, teclado/skeleton/capturas. A regressão anterior inclui cadastro/favoritos/rollback, carrinho/cupom/wei, pedido idempotente, timeout/reconexão, eventos reais Socket.IO e acesso direto. Nenhum teste foi ignorado ou flaky; baselines anteriores foram comparadas sem regeneração.

Relatórios preservados: 180 testes (local: `playwright-report/etapa5b/index.html`), verificação final de formulários/autofill (local: `playwright-report/etapa5b-final/index.html`) e verificação final de carteiras (local: `playwright-report/etapa5b-carteiras/index.html`). A rodada inicial corrigiu um PNG inválido do teste e um seletor ambíguo, sem enfraquecer as asserções. A revisão também isolou erros da API ao formulário de carteira enviado, evitando marcar a principal quando o cadastro da secundária falha. Capturas reais sem máscaras, anexadas ao relatório completo:

| Largura | Perfil | Carteiras |
| --- | --- | --- |
| 390px | Captura (local: `playwright-report/etapa5b/data/fc801f0169578509f09f27e203e61805a84ffa0a.png`) | Captura (local: `playwright-report/etapa5b/data/b515861c14bcfcd21e49d22b5ba3b63edc1bf362.png`) |
| 768px | Captura (local: `playwright-report/etapa5b/data/e81dbd40a5d7b8d77cca5e385ae72ca2945c038a.png`) | Captura (local: `playwright-report/etapa5b/data/b65d44a8aea20cb3707a1780d53af1f1ce46ca9d.png`) |
| 1440px | Captura (local: `playwright-report/etapa5b/data/786086919e6ad61c4d6c3381476af70ef37998da.png`) | Captura (local: `playwright-report/etapa5b/data/367535b5c24ab37ceb8198d591aff1159a50d4ab.png`) |

Nas capturas de página inteira mobile, a navegação inferior fixa aparece na posição do viewport inicial; ela acompanha o viewport ao rolar na aplicação. O conteúdo e as ações finais permanecem alcançáveis por rolagem/teclado. Não foram utilizadas capturas como implementação.

## Publicação de demonstração na Vercel · Etapa 5A

Registro ao encerrar a Etapa 5A: configuração preparada e validação local concluída. Depois, o usuário confirmou publicação pública validada com seis testes. Build/preview local por si só não comprovam publicação. O roteiro abaixo permite publicar novas versões; a Etapa 5B não fez deploy nem alterou baselines visuais.

`vercel.json` fixa preset `vite`, instalação `npm ci`, build `npm run build:demo` e saída `dist`. O fallback SPA preserva `/api`, `/assets`, `/socket.io` e `/mockServiceWorker.js`; demais rotas recebem `index.html`, incluindo login, carrinho, pagamento e pedidos. Arquivos existentes têm prioridade. O worker conserva `Cache-Control: no-cache` e não pode receber o HTML da SPA. Referências oficiais: [Vite/SPAs na Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas) e [configuração estática](https://vercel.com/docs/project-configuration/vercel-json).

Vite já gera caminhos absolutos na raiz, sem subdiretório/base customizada, sourcemaps públicos ou dependências privadas. `.env.demo` habilita MSW no build otimizado; o bootstrap aguarda `worker.start` antes de montar React e conectar Socket.IO. O artefato contém somente HTML, JS/CSS, worker, quatro imagens locais e `_redirects`; referências de design, testes, documentação, arquivos `.env` e relatórios não são servidos em `dist`. Os 658 registros com `resolved` do lockfile apontam para o registro público npm. `.gitignore` preserva apenas `.env.example`/`.env.demo` entre os arquivos de ambiente e ignora `.vercel/`, logs e artefatos locais.

| Variável no build | Valor para esta demonstração |
| --- | --- |
| `VITE_ENABLE_MOCKS` | `true`, já fornecido por `.env.demo`; remova qualquer override `false` no painel |
| `VITE_API_BASE_URL` | `/api`, padrão; não é necessário cadastrar no painel |
| `VITE_SOCKET_URL` | Ausente; cliente e mock usam a origem atual, com `wss` em HTTPS |

Variáveis `VITE_*` são públicas e incorporadas no build; alterações exigem novo deploy. Nenhum segredo, token de Vercel ou credencial privada é necessário. Não configure `localhost` nem um serviço externo de socket na demonstração. Socket.IO continua real no cliente, com protocolo interceptado pelo MSW; esta aplicação estática não cria um servidor WebSocket na Vercel. Sessão, carrinho e pedidos persistem somente no navegador/origem atual; outro domínio, dispositivo ou janela privada começa com dados próprios.

### Conectar o repositório e publicar

1. Revise as alterações locais e a pasta de evidências, crie o commit manualmente quando desejar e publique o repositório no GitHub/GitLab/Bitbucket. Confira a branch com `git branch --show-current` e selecione na Vercel a branch que contiver a entrega; não presuma `master` ou `main`. Inclua `evidence/etapa8/`, os assets e as otimizações; não envie `node_modules`, `dist`, `.env` privados, `.vercel`, logs ou diretórios de relatórios temporários. Nenhum commit/push foi executado pelo agente.
2. Na Vercel, abra **Add New → Project → Import Git Repository**, conecte a conta do provedor Git e selecione esse repositório. A conexão e a autorização da conta precisam ser feitas por você.
3. Use **Root Directory** `./` quando o repositório contiver `package.json`/`vercel.json` na raiz, como neste workspace; se publicar dentro de um monorepo, selecione a pasta `kurio`. Confira **Framework Preset** Vite, **Build Command** `npm run build:demo`, **Output Directory** `dist` e **Install Command** `npm ci`, já definidos no arquivo versionado. Use Node **24.x**, compatível com o ambiente validado ([versões suportadas](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)).
4. Em **Environment Variables**, mantenha os valores da tabela tanto para **Preview** quanto para **Production**; não copie variáveis locais de outro projeto. `VITE_ENABLE_MOCKS=true` pode ser cadastrado explicitamente ou vir de `.env.demo`; REST/socket podem ficar ausentes.
5. Clique **Deploy**, confira no log o comando de demonstração e o resultado do build, e copie a URL HTTPS emitida pela Vercel. Configure a branch publicada como **Production Branch**. Para avaliação externa, a URL escolhida deve abrir sem login da Vercel; revise **Deployment Protection** caso apareça uma barreira de acesso.
6. Valide a URL com o roteiro e os comandos abaixo. Se publicou um Preview, use **Promote to Production** somente após essa validação e repita as verificações no domínio final. Ao modificar variáveis ou código, gere outro deploy. Preserve a URL acessível durante a avaliação.

### Verificar a URL final

Em navegador sem dados anteriores, abra diretamente `/nfts/emerald-ape-042` e atualize. Confirme imagens/preço e indicador **Ao vivo**. Abra `/mockServiceWorker.js`: deve responder JavaScript, nunca HTML; em DevTools → Application → Service Workers, confira escopo `/`. Os headers da Vercel, HTTPS e proteção de acesso precisam ser conferidos no ambiente público; `vite preview` não emula a configuração da CDN.

Entre com `ana@kurio.test` / `KurioDemo!123`, recarregue e confira a sessão. Adicione NFT, abra diretamente `/carrinho`, atualize e siga para `/pagamento`; selecione MetaMask, conecte a carteira simulada, revise e confirme. O recibo só deve aparecer com `confirmed`; copie `/pedidos/:id` e abra/atualize na mesma origem. Teste também `/login`, `/cadastro`, `/favoritos`, `/pagamento` sem login e uma rota inexistente. Em **Cenários de demonstração**, altere o NFT para conferir `nft.updated`; use `pending` e desconexão/refresh para retomar o pedido, e `timeout` para recuperar a mesma compra sem duplicar. **Restaurar cenário** volta às fixtures.

Os mesmos testes podem executar contra uma URL externa: `E2E_BASE_URL` dispensa o servidor local. Eles usam contextos isolados e resetam somente a simulação do navegador, sem depender de API real. No PowerShell, use a URL pública atual abaixo; ajuste-a se o domínio da publicação mudar:

```powershell
$env:E2E_BASE_URL='https://kurio-frontend-challenge.vercel.app/'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/publicacao'
npx.cmd playwright test deploy.spec.ts --output=test-results/publicacao
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/publicacao-fluxos'
npx.cmd playwright test --grep 'sessão persiste no refresh|persistência do visitante|catálogo →|timeout após criação|pending sobrevive|order.updated privado|Socket.IO: evento real' --output=test-results/publicacao-fluxos
Remove-Item Env:E2E_BASE_URL
```

O segundo comando também compara pagamento/recibo com as baselines existentes; não use `--update-snapshots` para esconder divergências. Cada execução preserva seu relatório HTML. Validação pública só pode ser declarada após esses resultados e a inspeção de HTTPS/headers. Sem URL disponível, essa parte permanece pendente.

### Validação local executada em 22/10/2026

| Comando / verificação | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado |
| `npm.cmd run lint` | Aprovado |
| `npm.cmd run build:demo` | Aprovado; Vite 7.3.7, worker e mocks incluídos |
| `$env:E2E_PREVIEW='true'; $env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/etapa5a-smoke'; npx.cmd playwright test deploy.spec.ts --project=desktop --output=test-results/etapa5a-smoke` | 2 aprovados em 5,0s |
| `$env:E2E_PREVIEW='true'; $env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/etapa5a'; npx.cmd playwright test --grep 'deploy:\|catálogo: REST\|Socket.IO: evento real\|busca e paginação\|sessão persiste no refresh\|troca de usuário e autorização\|otimismo e rollback\|persistência do visitante\|merge no login\|aplicar e remover cupom\|precisão de 18 casas\|Socket.IO altera preço\|catálogo →\|timeout após criação\|pending sobrevive\|order.updated privado\|recusa libera reserva' --output=test-results/etapa5a` | **54 aprovados em 2,3min**, 18 por viewport, sem atualizar baselines |
| Inspeção de `dist`, lockfile e regras de ignore | Sem arquivos de ambiente, temporários, referências de design ou dependências privadas no artefato; sem origem localhost/exemplo incorporada |
| `git diff --check` | Aprovado |

Relatório: playwright-report/etapa5a/index.html (local: `playwright-report/etapa5a/index.html`). Os 54 testes incluem 48 execuções anteriores e seis novas, em 390/768/1440px. Cobrem catálogo/detalhe, URL/histórico, login/refresh/logout, isolamento, favoritos otimistas/rollback, carrinho persistente/merge/cupom/precisão, checkout confirmado/recusado, timeout idempotente, retomada pending e Socket.IO público/privado com reconexão e descarte de duplicatas. As 12 comparações de início, detalhe, pagamento e recibo passaram com as baselines existentes; as capturas de pagamento/recibo também estão anexadas ao relatório. Não há testes ignorados ou flaky.

Ao encerrar a Etapa 5A, permanecia o aviso de chunk principal de 518,71 kB (166,71 kB gzip), sem impedir o build. Nenhuma URL havia sido publicada/testada pelo agente; posteriormente o usuário confirmou publicação validada com seis testes. Aquela etapa não criou commits, perfil ou filtros. O aviso de tamanho foi resolvido na Etapa 8; os resultados daquela etapa estão no início deste documento.

## Checkout, carteiras e pedidos · Etapa 4

Em `/carrinho`, **Continuar ao checkout** abre `/pagamento`, com autenticação e retorno ao fluxo. Revise os dados do colecionador, selecione carteira/rede e provedor, conecte a carteira simulada e marque a revisão dos itens/valores/taxas. O servidor revalida a cotação na criação. Se houver mudança ou vencimento, a compra não é criada e exige nova revisão. ENS, indicação e observação são opcionais; nenhum endereço ENS é resolvido em rede real.

No mobile (até 600px), carteiras, provedores e total aparecem primeiro. **Revisar dados, NFTs e taxas** expande o formulário completo, cadastro adicional, resumo e aceite obrigatório. **Revisar compra**, com a revisão fechada, abre essa etapa e direciona ao primeiro campo inválido; com a revisão aberta, o botão passa a **Confirmar compra** e somente depois do aceite e das validações pode enviar o pedido. Contas sem carteira têm o cadastro aberto; **Trocar carteira** desconecta a conexão simulada. Cenários de demonstração/reset continuam disponíveis abaixo da ação. Desktop, recibo, login e cadastro foram preservados. [Comparação Figma / Antes / Depois da revisão visual 03](evidence/visual-03-pagamento/README.md) e [refinamento do CTA na revisão 03.1](evidence/visual-03-1-cta/README.md).

Ana e Bruno possuem carteiras principal Ethereum e reserva Polygon distintas nas fixtures; contas novas podem cadastrar suas carteiras no checkout. Validação aceita endereço `0x` com 40 dígitos hexadecimais ou ENS `.eth`, rede suportada e apelido. Conexão é vinculada à sessão e deve ser refeita após novo login. A política financeira de demonstração continua na cotação da Etapa 3, inclusive a taxa estimada de `0.016` ETH nas redes simuladas.

Cada tentativa salva seu payload e chave por usuário antes de enviar. Após falha/timeout, **Recuperar pedido** consulta/reenvia a mesma chave; eventos podem iniciar essa recuperação por REST automaticamente. O checkout não interpreta timeout como pagamento recusado. `/pedidos/:id` mostra pending/refused ou o recibo confirmado. **Iniciar nova tentativa** após recusa gera outra chave. O recibo usa o snapshot imutável do pedido; IDs de transação são simulados e não apontam para exploradores reais.

A fonte MSW migra catálogo/carrinhos anteriores para `kurio:mock-commerce:v1`. Estoque, pedidos, carteiras, conexões e carrinhos compartilham um snapshot persistido; criação/reserva e resolução/efeitos são commits únicos, serializados por Web Locks. Sem Web Locks, a fila protege somente a página atual. Não há servidor de produção; dados/tokens locais são inspecionáveis, e ausência de storage limita recuperação ao ciclo da página. Fechar o navegador suspende timers; consultas de carrinho/pedido reconciliam resoluções vencidas ao retomar.

Em **Cenários de demonstração → Checkout e pedidos**: `success`, `refused`, `pending`, `timeout`, `connection-refused`, `stale`, `price`, `sold-out`, `disconnect` e `session-expired`. Os botões **Confirmar pendentes** e **Recusar pendentes** resolvem pedidos retidos. Reset apaga pedidos/reservas, carteiras criadas, conexões, tentativas, drafts e cenários e restaura as fixtures; o botão da UI também encerra a sessão e recarrega.

Arquivos principais: `features/checkout/{page,order-page,wallet-panel,quote-summary,queries,attempt,validation}`, `mocks/{commerce-db,order-store,checkout-handlers,checkout-scenarios}`, contratos, router/shell, CTA do carrinho, wrappers transacionais e transporte privado Socket.IO. Testes: `tests/e2e/checkout.spec.ts`; a asserção do CTA no teste anterior de carrinho foi adaptada à ação agora disponível. Sem novas dependências ou commits automáticos. Contratos e decisões estão em [CONTRACTS.md](CONTRACTS.md) e [ARCHITECTURE.md](ARCHITECTURE.md).

### Validação final da Etapa 4

| Comando executado no PowerShell | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado |
| `npm.cmd run lint` | Aprovado |
| `npm.cmd run build:demo` | Aprovado; aviso de chunk principal de 518,71 kB (166,71 kB gzip) |
| `$env:E2E_PREVIEW='true'; npx.cmd playwright test --update-snapshots` | **138 aprovados em 8,8min**, incluindo os 84 anteriores; nenhuma falha, teste ignorado ou flaky |
| `$env:E2E_PREVIEW='true'; $env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/etapa4-final'; npx.cmd playwright test --grep 'catálogo →\|carteiras: validação\|reserva e pedido são atômicos\|layout responsivo\|catálogo: REST' --output=test-results/etapa4-final` | **15 aprovados**, sem regenerar snapshots; revisão final de acessibilidade, reserva concorrente entre duas abas e 15 comparações visuais |
| `git diff --check` | Aprovado |

São 18 cenários novos nos três viewports: fluxo completo, cadastro/validação de carteiras, conexão recusada, cotação alterada/vencida, estoque esgotado, duplo clique, resposta perdida após criar, conflito de chave/payload, refresh/reconexão, versões de eventos, isolamento Ana/Bruno, recusa/rollback, preservação de alterações posteriores no carrinho, concorrência e expiração da sessão. A suíte anterior mantém autenticação, favoritos, merge, cupons, precisão ETH, catálogo, URL e Socket.IO público. As correções finais associam erros de carteira aos campos com `aria-describedby`; o teste concorrente usa duas páginas reais.

Relatórios: suíte completa (local: `playwright-report/index.html`) e verificação final (local: `playwright-report/etapa4-final/index.html`). O segundo contém seis anexos sem máscaras, de pagamento e recibo. As baselines mascaram apenas identificadores variáveis; foram revistas e depois comparadas sem atualização. As capturas abaixo são da aplicação executada, não imagens usadas na implementação.

| Largura | Pagamento sem máscara | Recibo sem máscara |
| --- | --- | --- |
| 390px | Captura (local: `playwright-report/etapa4-final/data/bdab1c79f47e3a3fda71cab511e551cbae087b3b.png`) | Captura (local: `playwright-report/etapa4-final/data/5421522ff8f7b38c2a41a07f6af55cc5fcb9f3d2.png`) |
| 768px | Captura (local: `playwright-report/etapa4-final/data/2061d42ad1d157c89aace3d7a63fb96b553403ec.png`) | Captura (local: `playwright-report/etapa4-final/data/063f518dab2c4482b1c654222ab4905494c12899.png`) |
| 1440px | Captura (local: `playwright-report/etapa4-final/data/02dcafc50257ceb331490a173ec825495a9439f8.png`) | Captura (local: `playwright-report/etapa4-final/data/5f05b80deecb85203078a7d24f09d26ea4e6331a.png`) |

Reprodução adicional: clique duas vezes em **Confirmar compra** para verificar uma única tentativa; reenvie o POST com a mesma chave para recuperar o mesmo pedido. Para acesso indevido, abra como Bruno a URL de um pedido criado por Ana: a API responde 403. Os detalhes dos payloads e controles estão em CONTRACTS.md. Reset permite repetir os cenários com as fixtures originais.

Diferenças visuais remanescentes: fonte/cores provisórias, envelope SVG existente no lugar do asset “THANK YOU” ausente e formulário/revisão completos abaixo dos cards no mobile, pois esses dados obrigatórios não aparecem no frame mobile fornecido. Limites técnicos: simulação local, ausência de broadcast entre abas, fallback de lock restrito à página e recuperação de timers por REST após fechar o navegador. O aviso de tamanho do bundle permanece; Lighthouse, backend e deploy não foram executados nesta etapa. Tela dedicada de carteiras e perfil ficam para etapa posterior, mediante autorização.

## Carrinho e cotação · Etapa 3

Cards permitem abrir **Escolher edição**; detalhe permite selecionar edição/quantidade e adicionar. `/carrinho` funciona com visitante e conta. Carrinho, edições e cupons persistem via fonte MSW compartilhada; login combina o visitante à conta uma única vez. Logout/troca/expiração isolam os dados privados. O resumo é integralmente fornecido pela cotação REST, com precisão de 18 casas e validação de versão. Preço/estoque mudam pelo Socket.IO existente.

Cupom demonstrável: `KURIO10` (10%); `EXPIRADO` exercita expiração; outros códigos são inválidos. **Cenários de demonstração → Carrinho e cotação** permite falha de rede/503, latência, timeout e recuperação. **Alterar Emerald Ape** atualiza a cotação com o carrinho aberto. Alterações do carrinho/cotação não reservam estoque; a Etapa 4 ativa o checkout e reserva somente na criação do pedido.

Na Etapa 3, as referências locais de carrinho orientaram tabela/resumo desktop e cards/resumo mobile. Foram mantidos os assets, tokens e rodapé existentes; os blocos editoriais/newsletter/carteiras do frame não pertenciam ao escopo. Fonte original desconhecida e cores provisórias eram limitações daquela entrega.

Na revisão visual 04, somente `/carrinho` até 600px usa Roboto Mono local, cards de imagem quadrada, controles acessíveis e resumo próximo do Figma. A navegação fixa e o rodapé informativo ficam ocultos nessa rota; retorno ao mercado, detalhe, checkout, recomendações e cenários/reset continuam acessíveis. Desktop/tablet e as telas já revisadas foram preservados. [Comparação Figma / Antes / Depois, estados e testes](evidence/visual-04-carrinho/README.md).

Arquivos da Etapa 3: `src/features/cart/{identity,queries,purchase-controls,cart-link,page}`, `src/mocks/{cart-store,cart-handlers}`, contratos/fixtures/store/handlers, merge nos handlers de autenticação e cancelamento na sessão, router/shell, integração nos cards/detalhe, validação e reconciliação Socket.IO, helper ETH, ícone de remoção e CSS responsivo/autofill. Testes em `tests/e2e/cart.spec.ts`, asserções de ações atualizadas em `foundation.spec.ts` e baselines nas três pastas `*.spec.ts-snapshots`. Contratos e decisões completos em [CONTRACTS.md](CONTRACTS.md#carrinho-e-cotação--etapa-3) e [ARCHITECTURE.md](ARCHITECTURE.md#carrinho-e-cotação). Nenhuma dependência foi adicionada.

Limitações ao encerrar a Etapa 3: mocks persistiam no navegador sem transações entre abas/dispositivos; cotação não reservava estoque e usava taxa estimada fixa. O catálogo anterior migrou para a fixture com edições, preservando contas/favoritos. A navegação inferior mobile foi mantida no carrinho; em capturas de página inteira, sua posição fixa corresponde ao viewport inicial. Fonte, dados e conteúdo inferior diferem do frame. Validação no commit, reserva e idempotência foram implementadas posteriormente na Etapa 4, conforme a seção acima.

### Evidências visuais da Etapa 3

| Viewport | Carrinho | Campo com autofill e foco |
| --- | --- | --- |
| 390px | [Captura](tests/e2e/cart.spec.ts-snapshots/cart-mobile-win32.png) | [Captura](tests/e2e/cart.spec.ts-snapshots/login-autofill-mobile-win32.png) |
| 768px | [Captura](tests/e2e/cart.spec.ts-snapshots/cart-tablet-win32.png) | [Captura](tests/e2e/cart.spec.ts-snapshots/login-autofill-tablet-win32.png) |
| 1440px | [Captura](tests/e2e/cart.spec.ts-snapshots/cart-desktop-win32.png) | [Captura](tests/e2e/cart.spec.ts-snapshots/login-autofill-desktop-win32.png) |

Revisão visual local identificou e corrigiu o deslocamento das colunas/espaço superior desktop, o acesso direto ao carrinho no detalhe mobile e a sobreposição causada por preços ETH longos. As capturas são da aplicação executada no Chromium, não assets usados como implementação. Início/detalhe e login/cadastro continuam cobertos nas pastas de baselines anteriores.

### Validação final da Etapa 3

| Comando executado no PowerShell | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado; repetido também pelo script de build final |
| `npm.cmd run lint` | Aprovado após os ajustes finais |
| `npm.cmd run build:demo` | Aprovado, Vite 7.3.7, MSW habilitado |
| `$env:E2E_PREVIEW='true'; npx.cmd playwright test --project=mobile --grep 'merge no login\|isolamento entre Ana\|precisão de 18 casas\|catálogo: REST\|layout responsivo' --update-snapshots` | 5 aprovados em 24,7s após as correções mobile |
| `$env:E2E_PREVIEW='true'; npx.cmd playwright test` | **84 aprovados em 4,6min**, sem atualizar snapshots; 28 por viewport |
| `git diff --check` | Aprovado |

São 45 execuções novas (15 cenários de carrinho/cotação/autofill × 3 viewports) e 39 execuções anteriores. Incluem adição/listagem/detalhe, edições, alteração/remoção, validação de estoque na UI/REST, refresh, merge limitado e idempotente, isolamento Ana/Bruno/visitante, cupons, 18 casas e arredondamento em wei, paridade REST/UI, cotação vencida/desatualizada, sessão expirada com retorno ao carrinho, Socket.IO/versões/duplicatas/payload inválido, edição esgotada, falha de rede/503 e recuperação, resposta privada atrasada, skeleton, foco, overflow e regressão visual. Autofill é verificado via pseudo-classe real do Chromium forçada por CDP, incluindo foco, fundo e texto dos tokens. A suíte anterior preserva autenticação/favoritos, catálogo, URL/histórico e reconexão Socket.IO.

Rodadas iniciais detectaram o atalho mobile ausente e o overflow com ETH longo; ambos foram corrigidos antes da execução final. O helper de logout foi ajustado à navegação real pelo mercado. Baselines foram atualizadas intencionalmente e revisadas; a última execução comparou todas sem regeneração. Relatório final: playwright-report/index.html (local: `playwright-report/index.html`). Sem testes desabilitados, novas dependências, commits automáticos ou avanço para checkout/carteiras/pedidos.

## Instalação e comandos

Node >= 22.12 e npm. No PowerShell com scripts bloqueados, use `npm.cmd`/`npx.cmd`.

```sh
npm ci
npx playwright install chromium
npm run dev
npm run typecheck
npm run lint
npm run build:demo
npm run preview
npm run test:e2e
npm run test:e2e:report
```

O desenvolvimento abre em `http://127.0.0.1:5173`. Os testes iniciam seu servidor na porta 4173 e usam contextos Chromium isolados em 1440, 768 e 390px. Relatório HTML em `playwright-report/`; screenshots e traces de falhas em `test-results/`.

Os snapshots de início e detalhe ficam junto aos testes. Para regenerá-los intencionalmente: `npm run test:e2e -- --update-snapshots`. Baselines dependem do sistema operacional e da versão do Chromium; as incluídas foram geradas no Windows, com o navegador instalado pela versão do Playwright fixada no lockfile.

Para validar a demo compilada, execute `npm run build:demo` e depois, no PowerShell, `$env:E2E_PREVIEW='true'; npm run test:e2e`. Remova a variável com `Remove-Item Env:E2E_PREVIEW` para voltar ao servidor de desenvolvimento. O modo preview não reutiliza um dev server existente.

## Configuração

Veja `.env.example`. `VITE_ENABLE_MOCKS=true` habilita MSW e seus controles. Em desenvolvimento os mocks são ligados por padrão; `false` os desliga. `npm run build:demo` usa `.env.demo` para habilitá-los no build. `npm run build` gera a variante sem mocks habilitados, que exige uma API REST e um serviço Socket.IO compatíveis.

`VITE_API_BASE_URL` configura o prefixo REST (padrão `/api`); `VITE_SOCKET_URL` configura a origem Socket.IO (padrão origem da página). As variáveis Vite são públicas e definidas no build; não coloque segredos nelas. A demo não depende de backend nem conta privada.

`public/mockServiceWorker.js` é versionado. Ao atualizar MSW, execute `npx msw init public --save`. O worker exige localhost ou HTTPS. A aplicação aguarda sua inicialização antes de montar React e conectar o socket.

## Reprodução

1. Abra **Cenários de demonstração** e clique em **Restaurar cenário**. O reset restaura fixtures e cenário de rede e recarrega a página, limpando cache e conexão anteriores.
2. O Emerald Ape inicia em **1.19 ETH**, versão 1, com 8 edições.
3. Clique em **Alterar Emerald Ape**. O handler grava **1.49 ETH**, versão 2, com 7 edições, e emite `nft.updated` pelo binding Socket.IO. A interface anuncia o evento e atualiza a consulta. Abra o detalhe para conferir o mesmo valor.
4. Recarregue: o estado do catálogo persiste no armazenamento local. O próximo clique alterna para 1.19 ETH e incrementa a versão novamente.
5. Selecione `empty`, `error`, `slow`, `variable`, `offline` ou `timeout` para exercitar rede e feedback. `success` recupera a API. `variable` usa a paridade do comprimento da busca para latências reproduzíveis. No erro há **Tentar novamente**.

Busca, ordenação e página pertencem à URL. Exemplo direto: `/nfts/emerald-ape-042`; identificadores inexistentes mostram o erro da API. O contrato completo e controles HTTP estão em [CONTRACTS.md](./CONTRACTS.md).

## Comando Lighthouse

```sh
npm run build:demo
npm run audit
```

O comando executa as 12 medições (início/detalhe × desktop/mobile × três), agrega medianas e salva HTML/JSON em `.lighthouseci/final/`, com índice em `.lighthouseci/index.html`. `LH_PROFILE=desktop|mobile` limita um perfil; variável ausente mede ambos. Requer Chromium do Playwright ou `CHROME_PATH`. Metodologia, comparativo real, versões e limitações estão na seção Etapa 8 acima.

## Publicação e limites

Vercel tem configuração de demonstração e roteiro na seção da Etapa 5A; Netlify/Cloudflare Pages podem usar `public/_redirects` com prioridade dos arquivos existentes. O host deve servir assets e service worker como arquivos, e rotas da aplicação como `index.html`. A demo exige `npm run build:demo`, diretório `dist` e HTTPS. As rotas `/api/*` devem chegar à API quando mocks estiverem desativados; não há backend real configurado nesta entrega. Existe uma demonstração pública confirmada pelo usuário; alterações locais não chegam a ela sem um novo deploy. A coleta Lighthouse da Etapa 8 e sua regressão correspondem ao preview local de produção. Nenhuma publicação foi feita neste fechamento.

Tokens são aproximações das capturas. A família real ainda não foi identificada: `--font-kurio` usa Consolas/Liberation Mono/Courier New/monospace. O conector Figma negou leitura por falta de acesso de edição na Etapa 1; as capturas locais foram usadas conforme o kit. Não há alegação de fidelidade final.

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para cache, transporte, limites e próximos passos. As funcionalidades futuras ainda exigem os fluxos, cenários e testes completos do desafio oficial.

## Validação executada em 21/10/2026

Ambiente: Windows, Node 24.14.1, npm 10.6.0, Playwright 1.64.1, Chromium 156.0.8078.4 (revisão 1248), Vite 7.3.7. Dependências exatas em `package-lock.json`.

| Comando / verificação | Resultado |
| --- | --- |
| `npm ci --no-audit --no-fund` | Instalação limpa aprovada, 587 pacotes |
| `npm run typecheck` | Aprovado, TypeScript strict |
| `npm run lint` | Aprovado |
| `npm run build:demo` | Aprovado, inclui worker, assets e fallback SPA |
| `npm run test:e2e -- --update-snapshots` | 12 testes aprovados em 36,2s; 1440/768/390px, seis baselines criadas |
| `$env:E2E_PREVIEW='true'; npm run test:e2e -- --project=desktop --grep REST` | 2 testes aprovados em 14,6s na demo compilada, com comparação das baselines |
| Hashes SHA-256 dos quatro assets copiados | Idênticos aos originais |

O relatório HTML mais recente está em `playwright-report/index.html`. REST foi confirmado como resposta de service worker no teste do build. A prova Socket.IO confirmou preço 1.19 → 1.49 ETH, versão 1 → 2, disponibilidade 8 → 7 e igualdade do recurso entre evento e REST. Também passaram descarte de eventos duplicados/antigos/inválidos, atualização de detalhe, recuperação de evento perdido após reconexão, conexão após 35s de relógio controlado e persistência no refresh. A suíte maior verificou estados vazio/erro/loading, reduced motion, URL/histórico, acesso direto e ausência de overflow nos três viewports.

Correções verificadas durante a implementação: importação de Socket.IO posterior à inicialização MSW; handler compatível com a normalização de URL no MSW 2.15; API `toSocketIo` do binding publicado. As falhas iniciais de conexão foram resolvidas; nenhum teste foi desabilitado para obter aprovação.

## Etapa 1.5 · Alinhamento visual

Header desktop, hero distinto por viewport, sidebar com filtros em preparação, grid de três colunas no desktop e duas escalonadas no mobile, navegação inferior com cinco posições e detalhe com galeria/painel/áreas de interação. Ações futuras usam controles desativados e avisos de indisponibilidade. A busca desktop abre pelo ícone do header; a mobile permanece no topo. Tokens de cores continuam provisórios; o fallback tipográfico foi ajustado sem adicionar fontes externas.

Arquivos principais: `src/styles.css`, `src/app/shell.tsx`, páginas de `src/features/catalog/`, `NFTCard`, `NftGallery`, `FilterGroup`/`FilterOption`, `Icon` e `RelatedNfts`. Sem dependências novas nem alterações em REST, contratos, fixtures, cache ou implementação Socket.IO. Os relacionados reutilizam a consulta pública existente.

Validação final: `npm run typecheck`, `npm run lint` e `npm run build:demo` aprovados. Suíte em desenvolvimento: **12 aprovados (39,7s)**. Após a revisão das seis capturas e o ajuste final do ícone mobile, executado `$env:E2E_PREVIEW='true'; npm run test:e2e`: **12 aprovados (31,2s)** no build otimizado, sem atualizar baselines. Confirmados REST/MSW, URL/histórico, navegação direta, preço via Socket.IO, duplicatas/eventos antigos, reconexão, persistência, reduced motion e ausência de overflow em início/detalhe. Ações de compra e quantidade também foram verificadas como desativadas. Relatório HTML: `playwright-report/index.html`.

| Largura | Início | Detalhe |
| --- | --- | --- |
| 390px | [Captura](tests/e2e/foundation.spec.ts-snapshots/catalog-mobile-win32.png) | [Captura](tests/e2e/foundation.spec.ts-snapshots/detail-mobile-win32.png) |
| 768px | [Captura](tests/e2e/foundation.spec.ts-snapshots/catalog-tablet-win32.png) | [Captura](tests/e2e/foundation.spec.ts-snapshots/detail-tablet-win32.png) |
| 1440px | [Captura](tests/e2e/foundation.spec.ts-snapshots/catalog-desktop-win32.png) | [Captura](tests/e2e/foundation.spec.ts-snapshots/detail-desktop-win32.png) |

Diferenças remanescentes: início desktop isolado ausente (comparação feita com o fundo do modal); fonte exata desconhecida; dados/ordenação da API diferentes dos exemplos visuais; somente uma vista por NFT; avaliações/atributos sem contrato não inventados; footer e conteúdo inferior mantidos dentro do escopo. A comparação detalhada está em [ARCHITECTURE.md](./ARCHITECTURE.md#comparação-visual-e-diferenças-remanescentes). Sem commits automáticos e sem avanço à Etapa 2.

## Etapa 2 · Sessão e favoritos

Credenciais fictícias determinísticas (não use credenciais reais):

| Usuário | E-mail | Senha de demonstração |
| --- | --- | --- |
| Ana | `ana@kurio.test` | `KurioDemo!123` |
| Bruno | `bruno@kurio.test` | `KurioDemo!123` |

1. Abra **Entrar** no desktop ou o ícone de conta no mobile. **Criar conta/Crie uma conta** abre cadastro. Desktop usa modal sobre início/detalhe; mobile usa tela inteira. Social e recuperação de senha são explicitamente indisponíveis.
2. Entre como Ana, clique no coração de um card e abra **Seus favoritos**. O clique muda o estado otimisticamente; a API confirma. Recarregue para validar sessão e favoritos persistidos. No mobile, **Sair** fica no menu do ícone de conta; no desktop fica no header.
3. Saia e entre como Bruno: seus favoritos começam vazios. Volte à conta Ana e confira que os favoritos continuam associados a ela. `/favoritos` exige login e retorna a essa rota depois da autenticação.
4. Em **Cenários de demonstração → Sessão e favoritos**, `favorite-error` recusa mutations com 503 após 2s: o coração muda imediatamente e depois faz rollback com mensagem. `success` permite nova tentativa. A exclusão na lista privada também restaura o card e mostra o erro.
5. `private-slow` aplica 3s à consulta privada; `mutation-slow` aplica 2s à alteração. Faça logout durante a operação para observar cancelamento/isolamento. A suíte realiza a troca por navegação SPA, sem recarregar para esconder caches antigos.
6. **Expirar sessão** invalida a sessão no mock e reconsulta REST; o login reaparece com o destino preservado. `auth-error` produz falha 503 recuperável no login/cadastro/recuperação de sessão. Esses cenários persistem em `sessionStorage` durante refresh da aba; `success` ou **Restaurar cenário** os remove.
7. O reset geral restaura as duas contas originais, apaga contas criadas e favoritos e revoga sessões. O botão também faz logout local e recarrega. Não há commits automáticos, carrinho, checkout ou pedidos.

O cliente persiste somente um token de demonstração e confirma a identidade em GET `/session`. Senhas nunca são persistidas em texto claro; o MSW guarda salt/hash PBKDF2. A sessão expira após 30 minutos, é revalidada ao foco e é revogada ao sair. Logout em outra aba também encerra o acesso privado. Contratos, cache, cancelamento e limitações estão em [CONTRACTS.md](./CONTRACTS.md) e [ARCHITECTURE.md](./ARCHITECTURE.md).

Esta autenticação é uma simulação local: o armazenamento e o Bearer token são inspecionáveis no navegador. Não substitui autenticação de produção com backend/cookie seguro. Escritas simultâneas entre abas não têm transações. A detecção de expiração remota depende de REST/foco/timer; não há eventos privados nesta etapa.

Arquivos principais: `features/auth/{session,lifecycle,page,validation}`, `features/favorites/{queries,use-favorite,favorite-button,page}`, `mocks/{auth-store,auth-handlers,auth-scenarios}`, router/shell, integrações de favoritos nos cards/galeria/detalhe e `tests/e2e/auth.spec.ts`. Sem novas dependências. Capturas de login/cadastro em `tests/e2e/auth.spec.ts-snapshots/`, nos três viewports; início/detalhe continuam em `foundation.spec.ts-snapshots/`.

### Validação da Etapa 2

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Aprovado, strict |
| `npm run lint` | Aprovado |
| `npm run build:demo` | Aprovado, MSW incluído no build |
| `npm run test:e2e -- --update-snapshots` | 39 aprovados em 2,0min; baselines revisadas |
| `$env:E2E_PREVIEW='true'; npm run test:e2e` | 39 aprovados em 1,6min no build otimizado, sem atualizar baselines |
| `$env:E2E_PREVIEW='true'; npm run test:e2e -- auth.spec.ts --grep favoritar/desfavoritar` | 3 aprovados em 12,2s após ajuste final da posição do erro na galeria; erro confirmado dentro do viewport |
| `git diff --check` | Aprovado |

São 27 execuções novas de auth/favoritos e 12 da regressão existente, em 390/768/1440px. Cobrem cadastro/validação/conflito, login incorreto e falha 503 recuperável, retorno ao detalhe, persistência, logout/401, autorização 403 entre contas, troca de usuários sem refresh, consulta cancelada, mutation atrasada com barreira de conclusão, rollback de inclusão/remoção no catálogo/detalhe/lista, duplo clique com somente uma requisição, expiração e logout entre abas. A regressão mantém catálogo, REST/MSW, busca/paginação/histórico, reduced motion, eventos Socket.IO reais, versões antigas e reconexão.

O relatório completo foi preservado em playwright-report/index.html (local: `playwright-report/index.html`). A verificação final de detalhe usou `PLAYWRIGHT_HTML_OUTPUT_DIR=playwright-report/detail` e `--output=test-results/detail`, com relatório em playwright-report/detail/index.html (local: `playwright-report/detail/index.html`). Os testes não manipulam cache/hooks para simular sucesso. Nenhum teste foi desabilitado.
