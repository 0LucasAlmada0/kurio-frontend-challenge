# Kurio · Correções e fechamento da auditoria · 23/10/2026

**Regressão final: 300 aprovados, zero falhas, retries, flaky ou skips.** As metas Lighthouse ainda têm pendência de Performance indicada abaixo. Não se declara aprovação integral de desempenho. Nenhum commit, push, deploy ou submissão foi realizado.

Este é o conjunto atual preparado para publicação manual. A [auditoria inicial](../final-audit-2026-10-23/README.md), as evidências históricas da Etapa 8 e os originais locais permanecem preservados. [Verificação e hashes das cópias](verification.json).

**Veredito: PRONTO COM RESSALVAS.** A regressão está verde; a Home mobile permanece em 88, abaixo da meta 90. Commit/push e atualização da versão pública dependem do responsável pela entrega. As evidências novas estão preparadas localmente e ainda não estão acessíveis no GitHub antes desse push.

## Correções dos três testes

- Autofill desktop/tablet: os diffs de 1.830/1.848 pixels ficaram nos corações dos cards atrás do modal, corrigidos na revisão anterior. Os campos, formulário e foco não mudaram. Foram atualizadas **somente** login-autofill-desktop-win32.png e login-autofill-tablet-win32.png. As asserções de autofill, cor, sombra, foco e formulário permanecem intactas. Os hashes das outras 22 baselines são idênticos aos registrados antes da auditoria.
- Cancelamento de busca: a primeira consulta terminava em 1,2s antes de a interface disparar a segunda sob concorrência. O teste pausa os timers antes de iniciar ape, registra requestfailed antecipadamente, confirma que a mesma requisição ainda não terminou e só retoma o relógio após observar o cancelamento. Mantém a observação real de falha da requisição Axios/AbortSignal, os valores de URL ape/golden, a resposta final com três NFTs e a proteção contra resposta antiga após avançar 1,5s. Não houve aumento de timeout, substituição da REST/MSW nem remoção de asserção.
- Durante o desenvolvimento, a pausa precisava apontar para um instante futuro e o relógio precisava ser retomado após o cancelamento para a segunda resposta completar. As execuções intermediárias continuam locais; os resultados de validação abaixo são das versões corrigidas, sem retries.

## Performance: decisões medidas e limites

1. **Lazy das seções da Home: revertida.** Separou cerca de 6,7 kB de JS e 6,1 kB de CSS, levando o bootstrap de 504 para 498 kB, mas o diagnóstico da Home piorou de 88 para 85, com TBT 257 → 327 ms. O detalhe melhorou; o resultado misto não justificou manter a mudança. Shell e composição da Home foram restaurados integralmente. O aviso de chunk >500 kB, isoladamente, não é a causa comprovada da nota.
2. **Detecção de classes Tailwind limitada a src/: mantida.** A varredura padrão também alcançava HTMLs das evidências versionadas. A diretiva source na importação restringe somente a geração dos utilitários; componentes, CSS manual e conteúdo não foram removidos. CSS principal **81.174 → 72.010 bytes**, redução aproximada de 11,3%. O diagnóstico passou de 88/89 para 89/90 em Home/detalhe, com TBT menor nos dois. [Mecanismo oficial de detecção](https://tailwindcss.com/docs/detecting-classes-in-source-files#setting-your-base-path).
3. **Política de imagens: mantida.** Primeiro card recebe fetchPriority=high; imagens principais de catálogo/hero/detalhe usam decoding=async. Arquivos, qualidade, srcset, dimensões, alt e conteúdo permanecem iguais. Contra a candidata CSS, o diagnóstico manteve notas 89/90, com LCP do detalhe 2984 → 2899 ms e Home praticamente igual. Não se atribui todo o ganho final a esse sinal: uma execução é diagnóstica e tem variância.
4. Não foram modificados MSW, REST, Socket.IO, fixtures, ETH, autenticação, estoque, cache, revisão, idempotência ou recuperação. Não houve timers para esconder/adicionar conteúdo depois da medição, cache aquecido, mudança de throttling ou descarte de runs ruins. A fonte e as seções do Figma foram preservadas.

### Diagnósticos curtos — não são o resultado oficial

Uma execução fria por página mobile em cada candidata. HTML/JSON completos dessas rodadas permanecem em .lighthouseci/<nome>/; os pequenos resumos originais estão disponíveis abaixo. Não foram escolhidas as melhores execuções para compor o resultado final.

| Rodada | P Home | LCP Home ms | TBT Home ms | P detalhe | LCP detalhe ms | TBT detalhe ms | Decisão |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [recovery-before](diagnostics/recovery-before.json) | 88 | 2889.2 | 257.0 | 89 | 3035.5 | 227.0 | Controle |
| [recovery-lazy-home](diagnostics/recovery-lazy-home.json) | 85 | 2989.7 | 326.5 | 90 | 2995.8 | 217.5 | Revertida |
| [recovery-css-source](diagnostics/recovery-css-source.json) | 89 | 2968.0 | 243.0 | 90 | 2984.0 | 209.5 | Mantida / consolidada |
| [recovery-image-hints](diagnostics/recovery-image-hints.json) | 89 | 2966.7 | 243.5 | 90 | 2898.8 | 212.0 | Mantida / consolidada |

## Lighthouse oficial final — 12 medições

Comparativo com a auditoria inicial atual (89/88 mobile), sem substituir seus valores pelo histórico 92/92 da Etapa 8. Medianas independentes de três medições por página/perfil; LCP/TBT em ms, CLS sem unidade.

| Página / perfil | P antes | P final | A final | BP final | SEO final | LCP antes → final | CLS final | TBT antes → final | Metas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home / desktop | 99 | 99 | 100 | 100 | 100 | 778.6 → 790.9 | 0.010748 | 24.0 → 21.0 | Atingidas |
| Detalhe / desktop | 100 | 100 | 100 | 100 | 100 | 740.3 → 677.7 | 0.000000 | 16.0 → 13.0 | Atingidas |
| Home / mobile | 89 | 88 | 100 | 100 | 100 | 2894.5 → 2938.5 | 0.000415 | 248.0 → 274.0 | Pendente |
| Detalhe / mobile | 88 | 90 | 100 | 100 | 100 | 3059.2 → 2986.3 | 0.000689 | 257.5 → 209.0 | Atingidas |

A rodada oficial não confirmou ganho na Home: Performance 89 → 88, LCP 2894,5 → 2938,5 ms e TBT 248 → 274 ms. A execução Home mobile 1 teve 80 pontos/TBT 443 ms e foi preservada integralmente. Não há evidência suficiente para atribuir essa variação isoladamente a uma alteração; os diagnósticos controlados haviam melhorado, mas não substituem esta mediana oficial. A redução objetiva do CSS e a melhora do detalhe não significam aprovação da Home. Não se iniciou nova rodada arriscada para perseguir a nota.

| Medição | P | A | BP | SEO | LCP ms | CLS | TBT ms | Originais |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home-desktop-1 | 99 | 100 | 100 | 100 | 795.9 | 0.009312 | 20.5 | [HTML](lighthouse/home-desktop-1.html) / [JSON](lighthouse/home-desktop-1.json) |
| home-desktop-2 | 99 | 100 | 100 | 100 | 790.9 | 0.010748 | 22.0 | [HTML](lighthouse/home-desktop-2.html) / [JSON](lighthouse/home-desktop-2.json) |
| home-desktop-3 | 99 | 100 | 100 | 100 | 786.5 | 0.010748 | 21.0 | [HTML](lighthouse/home-desktop-3.html) / [JSON](lighthouse/home-desktop-3.json) |
| detail-desktop-1 | 100 | 100 | 100 | 100 | 662.3 | 0.000000 | 13.0 | [HTML](lighthouse/detail-desktop-1.html) / [JSON](lighthouse/detail-desktop-1.json) |
| detail-desktop-2 | 100 | 100 | 100 | 100 | 677.7 | 0.000000 | 17.5 | [HTML](lighthouse/detail-desktop-2.html) / [JSON](lighthouse/detail-desktop-2.json) |
| detail-desktop-3 | 100 | 100 | 100 | 100 | 717.7 | 0.000000 | 13.0 | [HTML](lighthouse/detail-desktop-3.html) / [JSON](lighthouse/detail-desktop-3.json) |
| home-mobile-1 | 80 | 100 | 100 | 100 | 3117.0 | 0.000415 | 443.0 | [HTML](lighthouse/home-mobile-1.html) / [JSON](lighthouse/home-mobile-1.json) |
| home-mobile-2 | 88 | 100 | 100 | 100 | 2901.6 | 0.000415 | 274.0 | [HTML](lighthouse/home-mobile-2.html) / [JSON](lighthouse/home-mobile-2.json) |
| home-mobile-3 | 88 | 100 | 100 | 100 | 2938.5 | 0.000415 | 260.0 | [HTML](lighthouse/home-mobile-3.html) / [JSON](lighthouse/home-mobile-3.json) |
| detail-mobile-1 | 91 | 100 | 100 | 100 | 2852.1 | 0.000689 | 209.0 | [HTML](lighthouse/detail-mobile-1.html) / [JSON](lighthouse/detail-mobile-1.json) |
| detail-mobile-2 | 90 | 100 | 100 | 100 | 2992.1 | 0.000689 | 211.0 | [HTML](lighthouse/detail-mobile-2.html) / [JSON](lighthouse/detail-mobile-2.json) |
| detail-mobile-3 | 90 | 100 | 100 | 100 | 2986.3 | 0.000722 | 205.5 | [HTML](lighthouse/detail-mobile-3.html) / [JSON](lighthouse/detail-mobile-3.json) |

[Medianas finais](lighthouse/summary.json) · [12 execuções/configurações efetivas e provas MSW/Socket.IO](lighthouse/runs.json) · [Resumo original anterior](before-summary.json). Os 24 HTML/JSON são cópias byte a byte; verification.json contém seus hashes SHA-256. Medições abaixo da meta, se presentes, estão incluídas nas medianas e na tabela.

Ambiente: Node v24.14.1, npm 10.6.0, Vite 7.3.7, Lighthouse 12.6.1, LHCI 0.15.1, Playwright 1.64.1, Chromium 156.0.8078.4 (revisão 1248), Windows 10.0.26200 x64, Intel i5-10400F/12 processadores lógicos/16 GiB. Perfis Chromium novos, armazenamento/cache frios, build:demo otimizado em localhost:4174. Nenhuma suíte E2E concorrente. Mobile: preset 412×823/DPR 1,75, RTT 150ms, throughput 1638,4 Kbps, CPU ×4; desktop 1350×940/DPR 1, RTT 40ms, 10240 Kbps, CPU ×1. Throttling simulate, sem alterações. Demais parâmetros/versões constam nos JSONs.

As 12 medições verificaram cenário padrão 1.19 ETH/v1, MSW/REST ativo, fontes e imagens carregadas e recepção de atualização pelo verdadeiro Socket.IO Client interceptado. O disparo de verificação do evento ocorre após a janela medida. Localhost não representa a CDN Vercel; recursos interceptados podem ter transferSize=0 no CDP, limitando o modelo Lantern. Best Practices não é auditoria completa de segurança.

## Validação e impacto visual/funcional

| Execução | Aprovados | Falhas | Retries | Skips |
| --- | --- | --- | --- | --- |
| Direcionados Fase A | 6 | 0 | 0 | 0 |
| Regressão integral Fase A | 300 | 0 | 0 | 0 |
| Visuais/compra após otimizações | 12 | 0 | 0 | 0 |
| Regressão integral final | 300 | 0 | 0 | 0 |

| Projeto final | Total | Aprovados | Falhas | Skips |
| --- | --- | --- | --- | --- |
| desktop | 100 | 100 | 0 | 0 |
| tablet | 100 | 100 | 0 | 0 |
| mobile | 100 | 100 | 0 | 0 |

Typecheck, lint, build de produção e build:demo aprovados. O aviso de chunk >500 kB permanece. git diff --check executado sem erros. A regressão final levou 11.74 minutos. [HTML Playwright final com todos os recursos](playwright/index.html). Foram verificados 58 anexos, nenhum ausente; 0 traces na execução final. Sem falhas finais, não há trace de falha novo a entregar.

Home, detalhe, carrinho, pagamento e recibo passaram nas comparações visuais de desktop/tablet/mobile. Cadastro/login, autenticação, favoritos/rollback, preço/estoque por Socket.IO, URL/filtros, carteiras, checkout/idempotência e recuperação passaram na suíte completa. A fonte continua local, sem alteração global. Somente os dois autofill receberam novos PNGs; não houve redesenho nem atualização de outras baselines.

## Arquivos e evidências de entrega

Alterações de aplicação: src/styles.css (escopo de geração Tailwind), src/components/nft-card.tsx, src/components/nft-gallery.tsx e src/features/catalog/page.tsx (dicas de imagens). Shell sem alteração final. Testes: tests/e2e/catalog.spec.ts e os dois PNGs de autofill. Ferramenta: scripts/lighthouse.mjs ganhou --diagnostic e índice que inclui a rodada nomeada, mantendo três execuções por combinação no modo oficial. Documentação: README.md e ARCHITECTURE.md; novos relatórios em evidence/final-audit-2026-10-23 e nesta pasta. Sem dependências novas, alterações no lockfile ou contratos.

O conjunto mínimo preparado contém este relatório, verification.json, before-summary.json, quatro resumos diagnósticos pequenos, os **12 HTML + 12 JSON finais**, runs.json/summary.json e o **Playwright index.html + recursos completos**. Configuração e runner permanecem versionados na raiz: [lighthouserc.cjs](../../lighthouserc.cjs), [scripts/lighthouse.mjs](../../scripts/lighthouse.mjs). Cópias originais, sem recalcular/editá-las. Bytes de evidências copiadas: **27961798** (26.67 MiB), mais estes dois arquivos de texto.

Os 48 HTML/JSON da Etapa 8/auditoria inicial e os três traces originais continuam locais e íntegros. Não foram duplicadas todas as rodadas intermediárias no Git. Diretórios de trabalho, dist e node_modules permanecem ignorados. As evidências desta pasta não são ignoradas, mas dependem de commit/push manual para ficarem disponíveis no GitHub. HTML pode ser baixado/aberto; o GitHub mostra seu código. Para navegar: npx playwright show-report evidence/final-recovery-2026-10-23/playwright.

Conferência final: **90 links locais válidos**, nenhum destino ausente ou ignorado; **85 arquivos novos de evidências, aproximadamente 26,8 MiB**, incluindo o registro da auditoria inicial. Todas as 81 cópias conferem com seus originais por SHA-256. As configurações efetivas das 12 medições são idênticas às da auditoria anterior. O build:demo foi repetido após adicionar os relatórios e todos os arquivos gerados continuaram byte a byte idênticos à versão testada/medida. Lint final aprovado. As quatro variantes WebP estão versionadas e não ignoradas; somente .env.demo/.env.example estão versionados. A varredura dos arquivos preparados não encontrou os padrões de segredo examinados.

Na verificação anônima de 23/10, repositório/README público e aplicação Vercel responderam HTTP 200. O novo índice de evidências respondeu HTTP 404, esperado enquanto o push manual não ocorrer. Isso está registrado em verification.json; não se declara que os novos resultados já estejam publicados.

Textos obsoletos corrigidos no README: “definitivo 249” virou histórico; fonte não identificada foi substituída por Roboto Mono local com escopo; notas da Etapa 8 receberam aviso histórico; links apontam para o conjunto atual; instruções distinguem diagnóstico e rodada oficial. ARCHITECTURE ganhou resumo atual, mantendo o histórico técnico.

## Reprodução e publicação manual

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run build:demo
$env:E2E_PREVIEW='true'
Remove-Item Env:E2E_BASE_URL -ErrorAction SilentlyContinue
npx.cmd playwright test --retries=0 --workers=3
Remove-Item Env:LH_PROFILE -ErrorAction SilentlyContinue
npm.cmd run audit -- outra-rodada-final
git diff --check
```

Diagnóstico opcional: definir LH_PROFILE=mobile e acrescentar --diagnostic; remover a variável e a flag para medir as 12 oficiais. Cada teste usa fixture/contexto isolado. Não é necessário um serviço privado.

Antes de publicar: revisar o diff e eventuais metas pendentes, adicionar apenas fontes/testes/docs/evidências finais, conferir status/check-ignore, decidir commit/push manual e publicar o mesmo código testado. Depois repetir o smoke público de deploy/compra/refresh na URL Vercel. **A URL pública ainda não contém estas correções locais; não foi feito deploy nesta rodada.** A auditoria anterior validou o deploy de então com 26 testes; isso não substitui validar a versão que será publicada.

Comandos para o responsável executar após revisar o diff, na raiz do repositório e na branch `main`:

```powershell
git status --short
git diff --check
git add -- README.md ARCHITECTURE.md scripts/lighthouse.mjs src/styles.css src/components/nft-card.tsx src/components/nft-gallery.tsx src/features/catalog/page.tsx
git add -- tests/e2e/catalog.spec.ts tests/e2e/cart.spec.ts-snapshots/login-autofill-desktop-win32.png tests/e2e/cart.spec.ts-snapshots/login-autofill-tablet-win32.png
git add -- evidence/final-audit-2026-10-23 evidence/final-recovery-2026-10-23
git diff --cached --stat
git diff --cached --check
git commit -m "fix: stabilize regression and finalize audit evidence"
git push origin main
```

Se a integração Git da Vercel estiver ativa, o push poderá disparar um deploy; confira a configuração antes de executar. Após o push, confirme o [índice atual no GitHub](https://github.com/0LucasAlmada0/kurio-frontend-challenge/blob/main/evidence/final-recovery-2026-10-23/README.md) e os HTML/JSON a partir dele. Esse link está preparado para a publicação e não comprova disponibilidade antes dela. Nenhum desses comandos de escrita Git foi executado nesta rodada.

Riscos remanescentes: Performance ainda tem meta pendente: consulte a tabela oficial; não foi iniciada nova rodada longa de otimização para forçar aprovação. Permanecem as limitações simuladas de armazenamento/locks, uma vista de galeria por NFT e ausência de nova verificação manual de zoom/aparelho físico ou instalação em checkout limpo nesta rodada. Nenhuma função foi desativada para elevar notas.
