# Evidencias finais da Etapa 8

Entrega congelada da rodada final existente, sem novas medicoes ou alteracao dos resultados. Os HTML/JSON do Lighthouse e todos os arquivos do Playwright sao copias identicas aos originais locais (SHA-256 conferido na preparacao). As rodadas intermediarias e traces de execucoes anteriores nao fazem parte desta entrega.

- [Indice HTML local](index.html) (abra apos clonar/baixar; o GitHub exibe o codigo de HTML).
- [Playwright final: 249 aprovados, nenhuma falha, flaky ou ignorado](playwright/index.html). Recursos em `playwright/data/` acompanham o HTML. Para abrir: `npx playwright show-report evidence/etapa8/playwright` na raiz do projeto.
- [Medianas finais e ambiente](lighthouse/summary.json), [12 execucoes, configuracoes efetivas e verificacao de MSW/Socket.IO](lighthouse/runs.json).
- [Configuracao Lighthouse](../../lighthouserc.cjs), [runner reproduzivel](../../scripts/lighthouse.mjs) e [comandos/metodologia](../../README.md).
- [Resumo original da linha de base](baseline-summary.json) e [validacao dos assets](image-optimization.json). Apenas o resumo inicial foi incluido; nao sao outras medicoes finais.

O runner continua escrevendo em `.lighthouseci/`, e Playwright em `playwright-report/`: essas pastas de trabalho permanecem ignoradas. As evidencias desta pasta ficam fora do build da aplicacao. Lighthouse foi medido no preview local de producao, nao na URL da Vercel; condicoes e limitacoes estao nos JSONs e no README principal.

## Medianas finais

| Pagina / perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home / desktop | 100 | 100 | 100 | 100 | 647.1 | 0.009312 | 18.0 |
| Detalhe / desktop | 100 | 100 | 100 | 100 | 701.3 | 0.000000 | 16.0 |
| Home / mobile | 92 | 100 | 100 | 100 | 2661.0 | 0.000415 | 209.5 |
| Detalhe / mobile | 92 | 100 | 100 | 100 | 2758.8 | 0.000000 | 208.0 |

Valores arredondados apenas nesta tabela; JSONs preservam a precisao original. Medianas calculadas separadamente por categoria/metrica em tres execucoes independentes por combinacao.

## As 12 medicoes finais

| Medicao | Relatorio | Dados originais |
| --- | --- | --- |
| home-desktop-1 | [HTML](lighthouse/home-desktop-1.html) | [JSON](lighthouse/home-desktop-1.json) |
| home-desktop-2 | [HTML](lighthouse/home-desktop-2.html) | [JSON](lighthouse/home-desktop-2.json) |
| home-desktop-3 | [HTML](lighthouse/home-desktop-3.html) | [JSON](lighthouse/home-desktop-3.json) |
| detail-desktop-1 | [HTML](lighthouse/detail-desktop-1.html) | [JSON](lighthouse/detail-desktop-1.json) |
| detail-desktop-2 | [HTML](lighthouse/detail-desktop-2.html) | [JSON](lighthouse/detail-desktop-2.json) |
| detail-desktop-3 | [HTML](lighthouse/detail-desktop-3.html) | [JSON](lighthouse/detail-desktop-3.json) |
| home-mobile-1 | [HTML](lighthouse/home-mobile-1.html) | [JSON](lighthouse/home-mobile-1.json) |
| home-mobile-2 | [HTML](lighthouse/home-mobile-2.html) | [JSON](lighthouse/home-mobile-2.json) |
| home-mobile-3 | [HTML](lighthouse/home-mobile-3.html) | [JSON](lighthouse/home-mobile-3.json) |
| detail-mobile-1 | [HTML](lighthouse/detail-mobile-1.html) | [JSON](lighthouse/detail-mobile-1.json) |
| detail-mobile-2 | [HTML](lighthouse/detail-mobile-2.html) | [JSON](lighthouse/detail-mobile-2.json) |
| detail-mobile-3 | [HTML](lighthouse/detail-mobile-3.html) | [JSON](lighthouse/detail-mobile-3.json) |
