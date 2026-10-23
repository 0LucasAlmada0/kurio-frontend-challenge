# Correção pontual · Favoritos dos cards

[Antes/depois do catálogo desktop](comparison-desktop.png), com recortes da listagem a partir das capturas originais, sem alterar seus pixels. [Desktop antes](desktop-grid-before.png) · [Desktop depois](desktop-grid-after.png) · [Tablet antes](tablet-grid-before.png) · [Tablet depois](tablet-grid-after.png) · [Mobile antes](mobile-before.png) · [Mobile depois](mobile-after.png).

## Causa e correção

No desktop 1440 px e tablet 768 px, o SVG tinha **2 × 24 px**: o padding horizontal de 16 + 16 px do Button deixava somente 2 px dentro do círculo de 34 px, e `flex-shrink: 1` comprimia o coração. O SVG existia e tinha stroke correto; a largura explicava o ponto/círculo vazio. No detalhe mobile, a borda de 1 px de cada lado consumia também os 2 px restantes, produzindo 0 px; aqui a medida era diferente. No catálogo mobile já existia uma regra corretiva de 20 × 20 px.

Mudança de duas regras em `src/styles.css`, exclusivamente `.card-favorite`: padding zero, ícone de 20 × 20 sem encolhimento e opacidade 1 para manter contraste sobre o fundo do círculo. Cores, posição e tamanho dos círculos e cards preservados; seleção continua usando o fill existente. O disabled/pending permanece nativo, com `aria-busy`, sem esconder o coração. Nenhum componente, API, autenticação ou regra de favoritos foi alterado.

[Métricas antes](before-metrics.json), [depois](after-metrics.json) e [verificação](verification.json): todos os oito ícones passaram de 2 para 20 px no desktop/tablet e continuam com 20 px no mobile 414. Geometria de cards, imagens e botões idêntica nas três larguras; screenshot mobile pixel a pixel igual. A correção recente do detalhe não foi tocada.

## Testes e baselines

Os três testes novos passaram em 10,3s, com desktop 1440, tablet 768 e mobile **414 × 896**: SVG, stroke/fill, contraste mínimo de 3:1 em relação ao fundo opaco, hover, foco visível por Tab, nome acessível, abertura real de Login, envio por Space, mutation pendente/desabilitada, seleção, rollback HTTP 503 e remoção confirmada. A checagem geométrica em `responsive.spec.ts` passou a abranger os oito corações também no desktop/tablet, em vez de verificar somente parte dos cards mobile.

Após comparar as imagens, somente `catalog-desktop-win32.png` e `catalog-tablet-win32.png` de `foundation.spec.ts` foram atualizadas: os corações restaurados e os círculos opacos são a mudança visual intencional. A execução delimitada passou em ambos os projetos (10,8s). A conferência SHA-256 confirmou as outras **22 baselines intactas**, incluindo catálogo mobile e detalhe mobile já ajustado na Revisão 06. Essa conferência usa o estado do início desta correção, preservando as alterações que já estavam pendentes.

**Regressão direcionada final: 36 testes aprovados em 1,4 minuto**, sem falhas, skips ou retries. Inclui catálogo/REST, busca/paginação, estados de falha, Socket.IO, favoritos/rollback/bloqueio de duplicatas, ícones do detalhe, alinhamento dos cards, filtros/slider e navegação responsiva. Typecheck, lint, `build:demo` e `git diff --check` aprovados. O build continua emitindo o aviso preexistente do chunk de 504 kB; não houve mudança de JavaScript ou nova dependência.

Comandos principais (PowerShell):

```powershell
npm.cmd run build:demo # inclui typecheck
npm.cmd run lint
git diff --check
$env:E2E_PREVIEW='true'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/card-favorites-final'
$pattern='corações dos cards|favoritar/desfavoritar|otimismo e rollback|detalhe: favorito|catálogo:|Socket.IO:|busca e paginação|cenários:|cards alinhados|slider duplo|painel rolável|formulários e conta'
npx.cmd playwright test tests/e2e/auth.spec.ts tests/e2e/foundation.spec.ts tests/e2e/responsive.spec.ts tests/e2e/detail-mobile.spec.ts --grep $pattern --max-failures=1 --output=test-results/card-favorites-final
```

Relatório HTML local: `playwright-report/card-favorites-final/index.html` (ignorado pelo Git). Os resultados reais extraídos dos relatórios estão em [verification.json](verification.json); as métricas e comparações desta pasta são versionáveis.

Arquivos desta correção: `src/styles.css`, `tests/e2e/auth.spec.ts`, `tests/e2e/responsive.spec.ts`, duas baselines do catálogo, esta pasta e um link no README principal. As demais alterações pendentes da Revisão Visual 06 foram preservadas.

Capturas no build de demonstração, Chromium, fontes/imagens carregadas, fixtures padrão e relógio determinístico. Sem commit, push, deploy ou refatorações extras.
