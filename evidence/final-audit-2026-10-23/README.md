# Kurio · Auditoria final pré-entrega · 23/10/2026

> **Registro histórico anterior às correções.** As notas, falhas e conclusões abaixo descrevem a auditoria inicial e foram preservadas. Os resultados da versão corrigida estão no [fechamento de 23/10](../final-recovery-2026-10-23/README.md). Referências a `test-results/` e `.lighthouseci/` são caminhos locais ignorados; o fechamento reúne as evidências finais preparadas para publicação.

**Veredito: NÃO PRONTO para o fechamento formal da submissão.** Os fluxos essenciais passaram, inclusive na Vercel, mas a regressão integral não está verde e as metas de Performance mobile não foram atingidas nesta medição atual. Não foi identificado bloqueador funcional eliminatório entre os fluxos exercitados. Existem pendências **ALTAS** de validação/desempenho e de disponibilização das evidências atuais.

Auditoria independente, somente leitura da aplicação, commit **958e747006f67266928691e66aa0697645f537b8**. Nenhuma alteração em código de aplicação, baselines, dependências ou configuração. Sem commit, push, deploy ou otimização. Os únicos arquivos novos fora dos diretórios ignorados são este relatório e verification.json.

Fonte de verdade: [README oficial integral](https://github.com/junglegaming/frontend-challenge/blob/main/README.md), consultado nesta rodada; SHA-256 da cópia: 4f78906ab513c6999f4ff5fd18c9d9b43192be453d4a4d62ee0f6154bc11acd5. Foram consultados README.md, ARCHITECTURE.md, CONTRACTS.md, scripts/configuração e fontes/testes dos fluxos relevantes. A matriz distingue execução observada de inspeção ou limitação.

## 1. Resultado e conformidade

Das 60 unidades de verificação: **51 ATENDIDO (85.0%)**, 6 PARCIAL, 1 NÃO ATENDIDO e 2 NÃO VERIFICADO. Percentual estrito, sem conceder pontos aos parciais ou não verificados; a granularidade da matriz é desta auditoria. **Não equivale à nota ponderada do avaliador.**

Não verificados: zoom real do navegador e instalação npm ci em um checkout novo. Fidelidade integral de todos os frames e operação manual com tecnologias assistivas não foram certificadas; os testes de layout/teclado e Lighthouse não justificam essa conclusão.

| Requisito | Implementação | Evidência | Status | Gravidade |
| --- | --- | --- | --- | --- |
| 01 · React e TypeScript | React 19; TypeScript strict, componentes tipados. | package.json; typecheck, builds e E2E executados. | ATENDIDO | — |
| 02 · TanStack Router efetivo | Rotas, search params, lazy routes, guards e navegação. | src/app/router.tsx; catalog, auth-close e optimization aprovados, salvo a falha de timing descrita. | ATENDIDO | — |
| 03 · TanStack Query efetivo | Queries, mutations, cache, invalidação e cancelamento. | catalog/auth/cart/checkout/account E2E; consultas REST e rollback observados. | ATENDIDO | — |
| 04 · Axios e REST | http centralizado, credenciais capturadas e AbortSignal. | src/api/http.ts; fromServiceWorker verificado por foundation, checkout e optimization. | ATENDIDO | — |
| 05 · Tailwind e shadcn/ui | Tailwind 4; Button/Input/Skeleton locais com padrões shadcn/Radix. | package.json, components.json e src/components/ui; formulários exercitados. | ATENDIDO | — |
| 06 · MSW na camada de rede | Bootstrap aguarda worker; handlers REST e fonte compartilhada. | main.tsx, mocks/handlers.ts; E2E local/público e 12 verificações pós-Lighthouse. | ATENDIDO | — |
| 07 · Socket.IO Client efetivo | Engine.IO/Socket.IO interceptado pelo binding MSW; sem setters de demo na UI. | realtime/client.ts, provider.tsx, mocks/socket.ts; eventos e recibos do listener em E2E. | ATENDIDO | — |
| 08 · Contratos e erros tipados | DTOs, HTTP 401/403/404/409/422/5xx e mensagens. | api/contracts.ts, CONTRACTS.md; account/auth/cart/checkout/catalog. | ATENDIDO | — |
| 09 · Skeletons, shimmer e reduced motion | Catálogo, detalhe e resumo de carrinho têm estados reservados. | components/loading.tsx; foundation, catalog, cart e responsive aprovados. | ATENDIDO | — |
| 10 · Busca efetiva e URL | REST recebe busca; URL restaura refresh e links compartilhados. | catalog.spec.ts:48,179; foundation.spec.ts:104. | ATENDIDO | — |
| 11 · Filtros combinados | Coleção, raridade, intervalo ETH e disponibilidade no MSW; AND/OR. | catalog.spec.ts:63,83,97,114; responsive slider mouse/touch/teclado. | ATENDIDO | — |
| 12 · Ordenação | Nome/preço com desempate estável e precisão BigInt. | catalog.spec.ts:97,134; src/lib/eth.ts. | ATENDIDO | — |
| 13 · Paginação e histórico | Página na URL; mudanças reiniciam página sem perder filtros. | catalog.spec.ts:146,161,179,196,217. | ATENDIDO | — |
| 14 · Loading, vazio, erro e recuperação | Retry visível; filtros e itens preservados nas falhas. | foundation.spec.ts:122; catalog.spec.ts:244,256; cart/account/checkout. | ATENDIDO | — |
| 15 · Detalhe direto e NFT inexistente | Rota direta/refresh; 404 REST com recuperação. | foundation e deploy; 26 verificações públicas aprovadas. | ATENDIDO | — |
| 16 · Galeria do NFT | Uma imagem real; três vistas adicionais e ampliação explicitamente indisponíveis. | components/nft-gallery.tsx; ARCHITECTURE registra ausência dos assets adicionais. | PARCIAL | MÉDIO |
| 17 · Edições, estoque e quantidade | Seleção real; limites no cliente/MSW e esgotamento. | cart.spec.ts:69,86,234; checkout:342,490; detail-mobile:100. | ATENDIDO | — |
| 18 · Favoritos persistidos por usuário | Card, detalhe e lista privada sincronizados; ícones visíveis. | auth.spec.ts:290,319,383; detail-mobile.spec.ts:65; responsive.spec.ts:45. | ATENDIDO | — |
| 19 · Otimismo e rollback | Mutation por NFT, bloqueio de duplicatas e rollback granular. | auth.spec.ts:440; use-favorite.ts; falha simulada e recuperação observadas. | ATENDIDO | — |
| 20 · Cadastro e login REST | Validações cliente/MSW, conflito e falha recuperável. | auth.spec.ts:59,470; auth-close.spec.ts:63. | ATENDIDO | — |
| 21 · Sessão, refresh, logout e expiração | Token opaco, validação REST, timer e sincronização entre abas. | auth.spec.ts:273,470,492; checkout.spec.ts:510. | ATENDIDO | — |
| 22 · Guards, retorno, X e Escape | Rotas privadas protegidas; fechar auth retorna ao público; sucesso mantém redirect. | auth-close:12 testes locais + 6 públicos; router.tsx e auth/page.tsx. | ATENDIDO | — |
| 23 · Isolamento e respostas atrasadas | Identidade nas keys; abort/cancel/remove; reautorização após latência. | auth:383,401,421; cart:130,265; account:213,231; checkout:431. | ATENDIDO | — |
| 24 · Perfil, avatar e senha | Edição, conflitos, tipo/tamanho/conteúdo de avatar, senha atual e PBKDF2. | account.spec.ts:62–125; 36/36 testes account aprovados. | ATENDIDO | — |
| 25 · Carteiras principal/secundária | Cadastro/edição/promoção, endereço/rede, duplicatas e persistência; checkout compartilhado. | account:146,174,192,213; checkout:124. | ATENDIDO | — |
| 26 · Carrinho: adicionar, editar e remover | REST/MSW por edição, quantidade inteira e limites de estoque. | cart:69,86,234; detalhe:100; checkout:490. | ATENDIDO | — |
| 27 · Persistência e merge visitante | Refresh, merge uma vez no login, preservação em falhas e isolamento. | cart:102,111,130,248,265; merge validado também na Vercel. | ATENDIDO | — |
| 28 · Cupons | Aplicação/remoção, código inválido e expirado; cotação autoritativa. | cart.spec.ts:151,165,177. | ATENDIDO | — |
| 29 · Precisão ETH e cotação | Strings decimais/wei BigInt; subtotal/desconto/taxa/total REST; validade e fingerprint. | cart:177,193,212; checkout:294,310,328; lib/eth.ts, mocks/cart-store.ts. | ATENDIDO | — |
| 30 · Formulário, carteira e revisão explícita | Campos obrigatórios, rede, conexão/recusa/desconexão; revisão antes de enviar. | checkout.spec.ts:155,216,247,281; account:174. | ATENDIDO | — |
| 31 · Pedido depende da resposta simulada | POST autenticado, revalidação final de preço/estoque/carteira e estados distintos. | checkout:85,310,342,353; mocks/order-store.ts. | ATENDIDO | — |
| 32 · Idempotência e clique repetido | Mesma chave/conteúdo recupera o pedido; conteúdo diferente conflita. | checkout.spec.ts:353,368,391,490. | ATENDIDO | — |
| 33 · Timeout, pending e retomada | Tentativa persistida; REST recupera após timeout, refresh e perda de evento. | checkout.spec.ts:368,402,414,510; 26 testes públicos incluem estes fluxos. | ATENDIDO | — |
| 34 · Recibo confirmado e imutável | Somente confirmed mostra recibo; snapshot de itens, carteira e valores. | checkout:85; account:192; order-page.tsx. | ATENDIDO | — |
| 35 · Efeitos de confirmação/recusa | Recusa preserva carrinho e libera reserva; confirmação retira só linhas/quantidades compradas. | checkout.spec.ts:448,468,481,490. | ATENDIDO | — |
| 36 · Fixtures, cenários e reset | Dois usuários; catálogo com filtros/páginas; fonte compartilhada persistida e reset integral. | mocks/fixtures.ts, commerce-db.ts; beforeEach E2E, optimization:65. | ATENDIDO | — |
| 37 · Falhas determinísticas REST | Slow/variable/offline/timeout, 401, conflitos, cupom/estoque e recusa de pagamento. | foundation/catalog/auth/account/cart/checkout exercitados. Ressalva específica de timing na linha 48. | ATENDIDO | — |
| 38 · nft.updated e versões | Preço/estoque reconciliados; duplicatas, antigos e eventos inválidos ignorados. | foundation.spec.ts:68; catalog:298; cart:193; checkout:294. | ATENDIDO | — |
| 39 · order.updated privado | Assinatura por sessão, autorização no mock e cleanup de listeners; estados terminais protegidos. | realtime/provider.tsx e mocks/socket.ts; checkout.spec.ts:414,431. | ATENDIDO | — |
| 40 · Reconexão e REST autoritativo | Refetch após reconexão; pending recupera confirmação perdida. | foundation:68; checkout:402,414; execução pública. | ATENDIDO | — |
| 41 · Responsividade 390/768/1440 | Controles, formulários, navegação inferior e telas baixas exercitados; 414 complementar. | responsive 12/12; detail-mobile 9/9; account 36/36; testes de auth/cart/checkout. | ATENDIDO | — |
| 42 · Fidelidade estrutural ao Figma | Seções e telas presentes; diferenças documentadas, fontes locais e dados reais da API. | design-references e evidence/visual-*; não foi refeita comparação integral pixel a pixel de todos os frames nesta auditoria. | PARCIAL | MÉDIO |
| 43 · Teclado, foco e diálogos | Dialog nativo, Escape, drawer, foco visível e controles alcançáveis. | auth-close, auth, catalog drawer, responsive, account e checkout aprovados. | ATENDIDO | — |
| 44 · Semântica, labels e feedback | Erros associados, alt, live regions, feedback de mutation e indisponibilidade honesta. | E2E de formulários; Accessibility 100 nas 12 medições. Não substitui avaliação manual assistiva. | ATENDIDO | — |
| 45 · Zoom sem perda de conteúdo | Reflow por viewport e telas baixas coberto; zoom real do navegador não exercitado. | Não há teste de zoom real na suíte inspecionada; não foi executado manualmente nesta rodada. | NÃO VERIFICADO | MÉDIO |
| 46 · E2E dos 12 grupos obrigatórios | 300 testes executáveis, Chromium desktop/tablet/mobile; compra e conta funcionais. | 297 passaram, 3 falharam; grupos de compra/account/auth íntegros. As falhas não foram ocultadas. | ATENDIDO | — |
| 47 · Regressão visual versionada | 24 baselines; Home/detalhe/carrinho/pagamento presentes; 22 comparações passaram e 2 divergiram. | Autofill desktop/tablet diverge somente nos corações ao fundo; hashes das 24 baselines preservados. | PARCIAL | MÉDIO |
| 48 · Isolamento e determinismo dos testes | Contextos/reset e relógio controlado; busca variable depende de corrida entre UI e 1,2s de latência. | catalog.spec.ts:229 falhou na suíte e passou 3/3 isolado; trace confirma ape finalizado antes de golden. | PARCIAL | MÉDIO |
| 49 · HTML Playwright e traces das falhas | Histórico público de 249 testes íntegro; relatório atual 300 testes + 3 traces está local e ignorado. | playwright-report/final-audit-2026-10-23: 73 anexos, nenhum ausente. Falta disponibilizar este conjunto atual. | PARCIAL | ALTO |
| 50 · Lighthouse 4 combinações × 3 | 12 execuções frias no build:demo padrão; nenhuma execução descartada. | HTML/JSON originais em .lighthouseci/final-audit-2026-10-23; MSW/assets/fontes/Socket verificados. | ATENDIDO | — |
| 51 · Metas Lighthouse | Desktop 99/100; mobile Home 89 e detalhe 88 em Performance; A/BP/SEO 100. | Medianas atuais de 12 medições; meta de Performance ≥90 não atingida em duas combinações. | NÃO ATENDIDO | ALTO |
| 52 · Configuração, métricas e ambiente LH | Runner/config versionados; LCP/CLS/TBT, versões e throttling registrados. | lighthouserc.cjs, scripts/lighthouse.mjs; summary.json e runs.json atuais e históricos. | ATENDIDO | — |
| 53 · Typecheck, lint e dois builds | Todos concluíram com exit 0; chunk demo 504,16 kB gera aviso, não erro. | Logs de typecheck/lint/build/build:demo desta auditoria; git diff --check aprovado. | ATENDIDO | — |
| 54 · Deploy público e rotas diretas | Vercel HTTP 200; fallback SPA, worker, refresh autenticado e compra validados. | 26/26 E2E públicos; 34 assets idênticos byte a byte ao dist auditado. | ATENDIDO | — |
| 55 · Repositório público e correspondência | Inicialmente 404; após ação do usuário, público e HEAD igual ao local. | API anônima private:false; README idêntico; 47 destinos na árvore pública e amostras HTTP 200. | ATENDIDO | — |
| 56 · Setup, env, credenciais e comandos | README oferece instalação, dev/demo/preview/testes/audit e cenários; sem serviço privado. | Scripts conferidos e comandos executados; package-lock usa somente registry.npmjs.org. | ATENDIDO | — |
| 57 · Arquitetura, contratos e documentação atual | Contratos/cache/sessão/reconciliação/UX documentados; trechos históricos ainda se contradizem com o estado atual. | README chama 249 de definitivo e ainda diz fonte não identificada; ARCH contém descrições antigas de ações desativadas. | PARCIAL | MÉDIO |
| 58 · Lockfile, worker, assets e licença da fonte | Lockfile, worker, PNG/WebP e fontes locais versionados; Roboto Mono OFL-1.1 com origem/hash. | git ls-files/check-ignore; fonts/README.md e LICENSE; assets provenientes do kit Figma do desafio. | ATENDIDO | — |
| 59 · Instalação partindo de checkout limpo | Build/testes aprovam no checkout atual; instalação nova independente não executada. | npm ci não foi repetido em diretório limpo nesta rodada; não se infere aprovação a partir de execução anterior. | NÃO VERIFICADO | MÉDIO |
| 60 · Segredos, logs e URLs privadas | Somente .env.demo/.env.example versionados; sem chaves comuns/logs sensíveis encontrados. | Varredura de padrões em fonte/config e 15 commits; nenhum .env privado/chave no histórico alcançável. Não é pentest. | ATENDIDO | — |

Critérios oficiais ponderados: visual/responsividade 20; fluxos/UX 20; integração/estado 15; tempo real 10; mocking 10; testes 10; acessibilidade 5; performance 5; arquitetura/documentação 5. A matriz cobre todos esses eixos; não foi inventada uma nota estética ou uma pontuação oficial. Os casos eliminatórios previstos no README foram procurados: uso efetivo da stack, compra dependente de REST, isolamento, eventos via Socket.IO e E2E executável foram observados.

## 2. Pendências classificadas e correção mínima recomendada

| ID | Gravidade | Achado / causa | Encaminhamento mínimo, somente após autorização |
| --- | --- | --- | --- |
| F1 | ALTO | Performance mobile: Home 89; detalhe 88, abaixo de 90. LCP e tarefas de inicialização pesam na nota; análise abaixo. | Perfilar tarefas de inicialização e descoberta das imagens LCP; reduzir somente trabalho comprovadamente desnecessário no carregamento inicial. Preservar MSW/Socket, layout e fontes. Repetir as 12 medições após eventual ajuste, sem escolher melhores runs. Não há ganho garantido por uma alteração de uma linha. |
| F2 | MÉDIO | Autofill desktop/tablet: 1.830/1.848 pixels divergem nos corações dos cards ao fundo. O campo de senha e suas verificações de autofill passaram. Baselines anteriores à correção dos ícones. | Revisar os comparativos preservados e atualizar exclusivamente login-autofill-desktop-win32.png e login-autofill-tablet-win32.png com justificativa. Não reverter os corações nem mascarar a região. |
| F3 | MÉDIO | catalog.spec.ts:229 espera requestfailed, porém ape já havia respondido 200 antes do início de golden. Passou 3/3 isolado e nos projetos tablet/mobile; depende de timing de UI sob carga. | Controlar explicitamente a janela pendente/relógio no teste, registrar o listener antes da transição e manter as verificações de cancelamento e de resultado final. Não aumentar tolerâncias nem substituir o teste por uma asserção mais fraca. |
| F4 | ALTO | O HTML público de Playwright cobre 249 testes históricos; não inclui as três falhas atuais. Os relatórios novos estão completos, mas ignorados e ainda indisponíveis no GitHub. | Após fechar a regressão, disponibilizar HTML + data/ do resultado realmente final e os 12 HTML/JSON atuais. Enquanto estas falhas existirem, entregar também seus três traces. |
| F5 | MÉDIO | Documentação mistura histórico com estado atual: “definitivo” 249 testes, fonte ainda desconhecida e descrições antigas de ações desativadas. | Atualizar resumo/evidências atuais e marcar claramente trechos históricos, preservando seu contexto técnico. |
| F6 | MÉDIO | Galeria com uma vista real; demais vistas/zoom desabilitados. Zoom do navegador e instalação limpa não exercitados. | Manter limitação explícita da galeria; não inventar assets. Fazer verificação manual de zoom e instalação limpa antes da submissão. |
| F7 | BAIXO | Aviso de chunk: demo bootstrap 504,16 kB; build sem mocks 516,34 kB. | Registrar; não é falha de build nem prova isolada da causa da nota. Qualquer divisão deve seguir o diagnóstico medido. |

O 404 inicial do repositório foi **resolvido pelo usuário**, que o tornou público durante a auditoria. API sem autenticação: private=false; HEAD remoto igual ao local; README 200 e idêntico. Não permanece bloqueio de acesso ao código.

## 3. Validações e regressão reais

| Comando / execução | Resultado |
| --- | --- |
| npm.cmd run typecheck | exit 0 |
| npm.cmd run lint | exit 0 |
| npm.cmd run build | exit 0; aviso de chunk >500 kB |
| npm.cmd run build:demo | exit 0; MSW e Socket.IO ativos |
| git diff --check | exit 0 |
| E2E_PREVIEW=true; npx.cmd playwright test --workers=3 | 297 aprovados, 3 falhas; 0 retries, 0 skips, 0 flaky registrados pelo runner; 12.84 min |
| Teste de busca isolado: --project=desktop --repeat-each=3 --workers=1 | 3 aprovados; repetição diagnóstica separada, não apaga a falha da regressão |
| Smoke público desktop/mobile (26 casos selecionados) | 26 aprovados; 0 falhas, retries ou skips |
| npm.cmd run audit -- final-audit-2026-10-23 | 12 auditorias concluídas; duas medianas de Performance abaixo da meta. O runner retorna exit 0 mesmo com metas pendentes. |

| Projeto | Total | Aprovados | Falhas | Retries | Skips |
| --- | --- | --- | --- | --- | --- |
| desktop | 100 | 98 | 2 | 0 | 0 |
| tablet | 100 | 99 | 1 | 0 | 0 |
| mobile | 100 | 100 | 0 | 0 | 0 |

As falhas foram cart.spec.ts:395 (autofill desktop/tablet) e catalog.spec.ts:229 (cancelamento desktop). Todos os 63 testes de checkout, 39 de autenticação, 12 de fechamento de Login, 36 de conta e 12 de responsividade passaram. Na suíte, os 24 testes com screenshot/baseline produziram 22 aprovações e duas diferenças; os hashes das 24 PNGs foram conferidos antes/depois, sem mudanças. Não foram usados update-snapshots, retries extras ou exclusões.

Relatórios **locais**, ignorados pelo Git (os links a seguir não estarão públicos só com o push deste relatório):

- [Regressão completa HTML](../../playwright-report/final-audit-2026-10-23/index.html), com 73 anexos presentes, incluindo 3 traces de falha.
- [Smoke Vercel HTML](../../playwright-report/final-audit-2026-10-23-public/index.html).
- [Diagnóstico isolado da busca](../../playwright-report/final-audit-2026-10-23-race/index.html).
- [Logs e verificações auxiliares](../../test-results/final-audit-2026-10-23/).

Para abrir: npx.cmd playwright show-report playwright-report/final-audit-2026-10-23. O relatório inclui expected/actual/diff dos dois snapshots. O trace da busca mostra ape iniciado em 167471,788 ms, espera/resposta de aproximadamente 1308 ms, e golden iniciado em 169016,500 ms. Portanto ape terminou aproximadamente 237 ms antes do início da consulta seguinte: não havia uma requisição em andamento para gerar requestfailed.

Comando público executado (PowerShell):

```powershell
$env:E2E_BASE_URL='https://kurio-frontend-challenge.vercel.app'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/final-audit-2026-10-23-public'
npx.cmd playwright test deploy.spec.ts auth-close.spec.ts optimization.spec.ts checkout.spec.ts auth.spec.ts cart.spec.ts foundation.spec.ts --project=desktop --project=mobile --workers=3 --grep 'deploy:|Login direto fecha|Login válido mantém|cancelar Login ou Cadastro|produção: MSW|sessão persiste no refresh|merge no login|catálogo → carrinho|timeout após criação|pending sobrevive|order.updated privado|Socket.IO: evento real' --output=test-results/final-audit-2026-10-23/public
```

Foram exercitados fallback HTTP de 11 rotas, worker e arquivos estáticos, detalhe direto/refresh, ausência de erro crítico de console no cenário padrão de Home/detalhe, MSW real, Socket.IO real interceptado, login/refresh, X/Escape, cadastro/retomada, merge visitante, compra/recibo, timeout e pending recuperado por REST. As alterações de dados são fixtures locais dos contextos Playwright, sem backend de pagamento.

## 4. Lighthouse atual, três medições por combinação

| Página / perfil | P histórico Etapa 8 | P atual | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms | Metas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home / desktop | 100 | 99 | 100 | 100 | 100 | 778.6 | 0.010748 | 24.0 | Atingidas |
| Detalhe / desktop | 100 | 100 | 100 | 100 | 100 | 740.3 | 0.000000 | 16.0 | Atingidas |
| Home / mobile | 92 | 89 | 100 | 100 | 100 | 2894.5 | 0.000415 | 248.0 | Performance pendente |
| Detalhe / mobile | 92 | 88 | 100 | 100 | 100 | 3059.2 | 0.000689 | 257.5 | Performance pendente |

Medianas calculadas independentemente por categoria e métrica. O histórico é identificado como histórico: não é outra medição do mesmo código. Não houve alteração da aplicação nesta auditoria. Desktop atende às quatro metas. **Performance mobile não atende; todas as outras categorias atendem.**

| Medição | P | A | BP | SEO | Originais locais |
| --- | --- | --- | --- | --- | --- |
| home-desktop-1 | 99 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/home-desktop-1.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/home-desktop-1.json) |
| home-desktop-2 | 99 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/home-desktop-2.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/home-desktop-2.json) |
| home-desktop-3 | 99 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/home-desktop-3.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/home-desktop-3.json) |
| detail-desktop-1 | 100 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/detail-desktop-1.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/detail-desktop-1.json) |
| detail-desktop-2 | 100 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/detail-desktop-2.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/detail-desktop-2.json) |
| detail-desktop-3 | 100 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/detail-desktop-3.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/detail-desktop-3.json) |
| home-mobile-1 | 89 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/home-mobile-1.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/home-mobile-1.json) |
| home-mobile-2 | 89 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/home-mobile-2.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/home-mobile-2.json) |
| home-mobile-3 | 78 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/home-mobile-3.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/home-mobile-3.json) |
| detail-mobile-1 | 88 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/detail-mobile-1.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/detail-mobile-1.json) |
| detail-mobile-2 | 88 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/detail-mobile-2.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/detail-mobile-2.json) |
| detail-mobile-3 | 87 | 100 | 100 | 100 | [HTML](../../.lighthouseci/final-audit-2026-10-23/detail-mobile-3.html) · [JSON](../../.lighthouseci/final-audit-2026-10-23/detail-mobile-3.json) |

[Medianas e ambiente atuais](../../.lighthouseci/final-audit-2026-10-23/summary.json) · [12 configurações efetivas, métricas e verificações](../../.lighthouseci/final-audit-2026-10-23/runs.json). Cada HTML/JSON é o original gerado; nenhum resultado foi editado. A Home mobile teve 89/89/78; detalhe mobile 88/88/87. A mediana não descarta o run 78.

Ambiente: Node v24.14.1; npm 10.6.0; Lighthouse 12.6.1; LHCI 0.15.1; Playwright 1.64.1; Chromium **156.0.8078.4** (arquivo do navegador, revisão Playwright 1248); Windows_NT 10.0.26200 x64; Intel i5-10400F 2,90 GHz, 12 processadores lógicos, 16 GiB RAM. Vite 7.3.7. Perfis novos e cache/storage frio em cada execução; não houve suíte Playwright concorrente. Build:demo servido por Vite preview em 127.0.0.1:4174, cenário padrão, sem rede privada.

Throttling Lighthouse **simulate**: mobile RTT 150 ms, throughput 1638,4 Kbps e CPU ×4, viewport 412×823 / DPR 1,75; desktop RTT 40 ms, 10240 Kbps e CPU ×1, viewport 1350×940 / DPR 1. As configurações completas estão em runs.json, inclusive os parâmetros adicionais de request latency/download/upload. O viewport Lighthouse é o preset oficial da ferramenta, distinto dos viewports 390/768/1440 do E2E.

Em todas as 12 execuções foram confirmados: controlador do worker, REST fromServiceWorker, fixture padrão 1.19 ETH/v1, imagens visíveis carregadas, fontes prontas e recepção de evento pelo cliente Socket.IO. A verificação ativa do evento ocorre após a janela medida. As capturas loaded são pós-medição; as capturas efetivamente medidas estão nos próprios relatórios. localhost e rede simulada não representam latência real da CDN; transferSize=0 em parte dos recursos interceptados por MSW limita estimativas Lantern de bytes. Nenhum recurso foi desativado para elevar a pontuação.

### Diagnóstico da regressão, sem otimização especulativa

- Home mobile: LCP é a imagem do primeiro card. No run 1, cerca de **1.604 ms (55%)** são atraso de renderização; a principal tarefa longa atribuída ao bootstrap dura **413 ms**. O CLS mobile permaneceu 0,000415; não explica a queda. TBT mediano cresceu de 209,5 para 248,0 ms e LCP de 2661,0 para 2894,5 ms.
- Detalhe mobile: LCP é a imagem principal. No run 1, **1.682 ms (55%)** correspondem à descoberta/início tardio da carga e 565 ms à renderização. TBT mediano cresceu de 208,0 para 257,5 ms; LCP de 2758,8 para 3059,2 ms. Há tarefas longas de inicialização e custo de render; não foi observado erro de rede que invalidasse a medição.
- Comparando o primeiro run Home de cada época, o tempo de style/layout passou de **152 para 319 ms**, avaliação de scripts de **1083 para 1258 ms**, DOM de **382 para 484 elementos**, CSS observado de **58041 para 87241 bytes**, e fontes de **0 para 25376 bytes**. O bootstrap atual é 504164 bytes; o aviso >500 kB sozinho não identifica o gargalo. O arquivo WebP LCP permanece o mesmo asset; não houve troca por PNG durante o teste.
- O commit 8adb777 contém a auditoria histórica; desde ele foram adicionadas seções institucionais/editoriais da Home e estilos das revisões mobile. O shell importa as seções da Home de forma eager. Isso é um candidato concreto para separar carregamento por rota, mas **não foi feito um teste A/B que prove quanto cada componente/CSS/fonte causou da regressão**. Atribuição medida: tarefas iniciais, renderização e descoberta de LCP; atribuição exata a uma linha de código permanece pendente. Corrigir antes de medir esse recorte seria especulativo.

Não se recomenda remover a Roboto Mono, esconder seções do Figma, desativar MSW/Socket ou aquecer a página para atingir a meta. Caso autorize correção, o recorte inicial deve ser o trabalho eager de conteúdo exclusivo de Home e o caminho até a imagem do detalhe, com nova medição e regressão.

## 5. Evidências obrigatórias versus extras

| Evidência exigida no enunciado | Situação pública/versionada | Pendência atual |
| --- | --- | --- |
| Código, lockfile, mocks, fixtures, testes, worker e assets | Presentes no HEAD público; 34 arquivos de dist iguais ao deploy | Nenhuma divergência de bytes nos arquivos verificados |
| Baselines Home/detalhe/carrinho/pagamento | 24 PNGs versionadas; cobertura dos quatro tipos de tela nos três projetos | Revisar somente os dois autofill, que são cobertura extra às quatro telas obrigatórias |
| HTML Playwright + recursos | evidence/etapa8/playwright tem histórico íntegro de 249 testes | HTML atual de 300 + data/ está local/ignorado; disponibilizar versão realmente final |
| Traces das falhas | Histórico de 249 não tinha falhas, logo não exige traces daquela execução | A auditoria atual teve 3 falhas e preservou seus 3 traces; entregar enquanto forem as falhas finais |
| Lighthouse: 12 HTML + 12 JSON | Histórico Etapa 8 público e íntegro, com configuração/medianas | As 12 medições novas estão completas e ignoradas; entregar sem substituir suas notas por valores históricos |
| Configuração, versões, condições e reprodução | lighthouserc.cjs/scripts versionados, README e JSONs com método | Adicionar referência às medições e ao HTML realmente atuais após fechar os achados |
| README, ARCHITECTURE e contratos | Públicos e acessíveis; 47 destinos locais encontrados na árvore pública | Retificar resumo e trechos desatualizados, sem apagar histórico útil |
| Screenshots/traces aplicáveis | Baselines e diffs/falhas atuais preservados no HTML local | Capturas Figma/Antes/Depois de revisões são extras, não requisito de versionar todas as rodadas |

Tamanhos: histórico Etapa 8 **20.48 MiB**; HTML Playwright atual com data/ **25.60 MiB**; pasta Lighthouse atual inteira **19.12 MiB**. Estes últimos incluem recursos legítimos de evidência. Os artefatos de trabalho continuam ignorados; não foram copiados em massa para o Git. Não versionar node_modules, dist, caches, todas as rodadas intermediárias ou duplicatas de traces/anexos que já acompanham o HTML. Os HTML não são renderizados diretamente pelo GitHub; abrir com playwright show-report ou baixar os relatórios.

O runner aceita o nome desta rodada, mas seu índice geral .lighthouseci/index.html lista somente as fases históricas fixas. Por isso o índice desta auditoria são os links diretos acima; abrir o índice histórico não demonstra as notas novas.

## 6. Segurança, fontes, links e riscos restantes

- HEAD e 15 commits/referências locais alcançáveis: nenhum padrão de chave comum ou cabeçalho de chave privada encontrado em fonte/config/scripts; nenhum histórico de .env privado/.npmrc/chave encontrado. Só .env.demo e .env.example estão versionados. Uma varredura por padrões não garante detectar qualquer segredo possível; não houve pentest nem auditoria de dependências.
- Não foram encontrados logs sensíveis no código de runtime nem endpoints privados. Os logs de scripts são de auditoria; credenciais dos testes são as duas fixtures fictícias. Tokens/dados da simulação local não constituem autenticação de produção; essa limitação está documentada.
- Roboto Mono Latin 400/700 WOFF2 está local, com licença OFL-1.1, origem Fontsource e hashes em src/features/auth/assets/fonts/README.md. Os quatro NFTs vêm dos assets do Figma fornecido para o desafio; não foi anexada declaração jurídica de direitos além dessa origem. Ícones de provedores são apresentação de login indisponível, sem integração real.
- A simulação usa armazenamento do navegador; Web Locks protege o comércio entre abas quando suportado. Sem storage/locks, há limitações documentadas de persistência/concorrência. Isso não substitui backend transacional e não é exigida blockchain real pelo desafio.
- Zero erro crítico de console no cenário padrão monitorado de Home/detalhe local e público; casos de erro provocados são intencionais. Não se afirma ausência de qualquer erro em todas as combinações possíveis.
- Repositório agora público; README remoto igual ao local; 47 destinos dos documentos presentes na árvore pública, nenhum link local ausente. Nove amostras de documentos/HTML/JSON/baseline responderam 200 sem autenticação. URLs de itens inexistentes têm fallback SPA e erro de recurso na interface, comportamento esperado.
- Sem certificado de zoom real, leitor de tela manual ou aparelho físico Safari/iOS nesta auditoria. Em Chromium, teclado, foco, touch, alturas reduzidas e três breakpoints foram exercitados. A11y 100 e Best Practices 100 não são certificação completa de acessibilidade ou segurança.

## 7. Checklist exato antes da submissão

1. Autorizar, se desejar, as correções mínimas dos achados F1–F5; não foi alterado código durante a auditoria. Prioridade: metas mobile e regressão estável.
2. Revisar e justificar as duas baselines de autofill; corrigir o controle de timing da busca mantendo a cobertura. Executar novamente a suíte integral e registrar falhas/retries/skips reais; não substituir a execução integral pelo smoke de 26 testes ou pelo 3/3 isolado.
3. Após eventual otimização, executar typecheck, lint, build, build:demo, diff --check e as 12 auditorias no demo com funcionalidades ativas. Exigir medianas ≥90/95/95/90, ou declarar explicitamente as metas ainda pendentes na entrega.
4. Fazer npm ci/build:demo em checkout limpo e verificação manual de zoom/reflow antes de declarar esses dois itens atendidos.
5. Disponibilizar apenas o conjunto final em uma pasta organizada de evidências ou arquivo público de entrega: Playwright index.html + todos os arquivos data/ referenciados; traces das falhas finais, se existirem; 12 Lighthouse HTML/JSON + runs/summary/config/ambiente. Preservar os originais e não atualizar resultados manualmente.
6. Atualizar o resumo/links do README para esse conjunto, mantendo o histórico da Etapa 8 identificado. Conferir git status, git check-ignore e todos os links; não incluir diretórios temporários gigantes nem dados reais.
7. Conferir o diff e executar git diff --check. O usuário deve decidir o commit/push; esta auditoria não os fez. Se houver mudança de aplicação, o usuário deve publicar o mesmo commit testado e repetir o smoke na URL final. Se forem somente docs/testes/baselines, verificar que os assets da aplicação continuam iguais.
8. Confirmar anonimamente repositório público, README/evidências e URL Vercel; incluir ambos os links na submissão ao desafio antes de 23/10/2026 15h39 Brasília. Manter demo acessível e instruções/fixtures de avaliação no README.

Links de submissão: [repositório](https://github.com/0LucasAlmada0/kurio-frontend-challenge) · [aplicação](https://kurio-frontend-challenge.vercel.app/).

**Conclusão técnica:** não apareceu falha essencial de compra, sessão, isolamento ou tempo real nos fluxos testados. Há duas metas mobile não atingidas e uma regressão integral com três falhas conhecidas; portanto não se recomenda apresentar a entrega como integralmente aprovada agora. As correções e a atualização das evidências dependem de autorização; nenhuma foi aplicada.
