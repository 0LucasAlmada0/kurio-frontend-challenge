# Revisão visual 06 · Detalhe mobile

[Comparação Figma / Antes / Depois em 414 × 896](comparison-414.png). Referência: [PNG original](../../design-references/mobile/detalhe-nft.png), normalizado proporcionalmente para [414 × 896](figma-414.png). Capturas no build de demonstração, fixtures padrão, relógio determinístico, fontes e imagens visíveis carregadas.

## Diagnóstico e ajustes

| Área | Diagnóstico | Correção |
| --- | --- | --- |
| Favorito | SVG existente, mas largura renderizada de **0 px**: o padding horizontal do Button ocupava o círculo de 34 px e o flex encolhia o SVG. | Padding zerado, SVG sem encolhimento, ícone de 20 × 20 e cor primária. Área de toque expandida sem deslocar o círculo ou a foto. |
| Informações | Fonte provisória e metadados com espaçamento excessivo. | Roboto Mono local apenas na cópia do detalhe mobile; descrição legível, labels destacados e metadados compactados. Dados REST preservados. |
| Edições | Seleção preenchida e formato retangular diferentes da referência. | Chips arredondados com seleção em contorno; área de toque ampliada sem inflar a composição. Seleção, estoque e bloqueios anteriores intactos. |
| Compra | Colunas iguais e controles pequenos; hierarquia de quantidade, preço e ações pouco clara. | Colunas proporcionais, quantidade com controles de 44 px de altura, preço à direita, CTA de 60 px e acesso ao carrinho separado. Feedback de sucesso/erro mantido. |
| Conteúdo inferior | Informações, recomendações, eventos e demonstração já funcionais. | Preservados, sem novos painéis fixos e sem ocultar conteúdo. |

Todas as regras novas exigem `max-width: 600px` e `.is-detail:not(.is-auth)`. Os componentes compartilhados, handlers, autenticação, estoque, carrinho, queries, REST/MSW e Socket.IO não foram alterados. Cadastro/Login e o detalhe usado como fundo do modal ficam fora dos ajustes. Nenhuma dependência, fonte ou imagem nova.

## Capturas e controles

| Viewport | Antes | Depois |
| --- | --- | --- |
| 414 × 896 | [Primeira dobra](mobile-414-before-viewport.png) · [Página inteira](mobile-414-before.png) | [Primeira dobra](mobile-414-after-viewport.png) · [Página inteira](mobile-414-after.png) |
| 390 × 844 | [Primeira dobra](mobile-390-before-viewport.png) · [Página inteira](mobile-390-before.png) | [Primeira dobra](mobile-390-after-viewport.png) · [Página inteira](mobile-390-after.png) |
| 390 × 500 | [Primeira dobra](mobile-short-before-viewport.png) · [Página inteira](mobile-short-before.png) | [Primeira dobra](mobile-short-after-viewport.png) · [Página inteira](mobile-short-after.png) |
| Desktop 1440 × 1000 | [Página inteira](desktop-before.png) | [Página inteira](desktop-after.png) |
| Tablet 768 × 1024 | [Página inteira](tablet-before.png) | [Página inteira](tablet-after.png) |

Favorito com sessão Ana, após mutations REST reais da demonstração: [inativo](favorite-inactive-414.png) e [ativo](favorite-active-414.png). A captura ativa foi feita após confirmação do servidor, sem forçar atributos ou estado no React.

[Métricas antes](before-metrics.json), [depois](after-metrics.json) e [verificação](verification.json). Desktop e tablet ficaram **pixel a pixel idênticos**. A geometria da imagem principal e do título permaneceu igual nas cinco dimensões capturadas. Nenhum overflow horizontal. No mobile curto, a compra é alcançável por rolagem e teclado, sem overlay fixo.

## Baseline e validação

Única baseline atualizada, após a comparação visual: `tests/e2e/foundation.spec.ts-snapshots/detail-mobile-win32.png`. Justificativa: coração antes invisível, fonte local, hierarquia dos metadados, seleção das edições e dimensões/distribuição da área de compra. A conferência SHA-256 confirmou as outras **23 baselines intactas**; a captura da Home também permaneceu igual no teste de atualização.

Os nove testes novos passaram nos três projetos, em 20,3s: dados REST, ícone, área de toque, foco, três dimensões mobile, favorito por teclado, autenticação, rollback, edições, estoque, quantidade, ETH de 18 casas via evento Socket.IO, erro de mutation, recuperação e acesso ao carrinho. A primeira rodada encontrou um seletor ambíguo entre o status da compra e o anúncio de revalidação; a asserção foi delimitada ao texto esperado, sem modificar a aplicação ou retirar verificações.

**Rodada final direcionada: 54 testes aprovados em 1,9 minuto**, com três workers, sem falhas, skips ou retries. Inclui os novos cenários e os testes existentes de detalhe/catálogo, Socket.IO, seleção de edição, estoque, quantidade, carrinho, falhas/recuperação, favorito/rollback, autenticação com capturas, fonte local e responsividade. Typecheck, lint, `build:demo` e `git diff --check` aprovados. O build mantém o aviso preexistente de chunk acima de 500 kB; nenhum Lighthouse foi executado.

A primeira regressão direcionada parou com 39 aprovados, 1 falha, 2 interrompidos e 9 não executados: o teste alterava o viewport mantendo o link do carrinho focado, e o navegador preservava esse foco em vez do topo necessário para medir a área de toque do favorito. A preparação agora sai do foco anterior antes do resize e revela o favorito antes do hit test. A aplicação não recebeu alterações adicionais. Uma seleção inicial com regex ancorada não encontrou testes e foi corrigida antes de medir a regressão. Os resultados reais das rodadas estão em [verification.json](verification.json).

Comandos executados (PowerShell):

```powershell
npm.cmd run build:demo # inclui npm run typecheck
npm.cmd run lint
git diff --check
$env:E2E_PREVIEW='true'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-06-final-corrected'
$pattern='detalhe:|catálogo:|Socket.IO:|busca e paginação|cenários:|adicionar pela listagem|quantidade válida|edição esgotada|falhas de servidor e rede|favoritar/desfavoritar|cadastro validado|Roboto Mono|cards alinhados|slider duplo|painel rolável|formulários e conta'
npx.cmd playwright test tests/e2e/detail-mobile.spec.ts tests/e2e/foundation.spec.ts tests/e2e/cart.spec.ts tests/e2e/auth.spec.ts tests/e2e/responsive.spec.ts --grep $pattern --max-failures=1 --output=test-results/visual-06-final-corrected
```

O relatório HTML completo está localmente em `playwright-report/visual-06-final-corrected/index.html`, ignorado pelo Git; esta pasta contém as evidências selecionadas e os resultados extraídos do relatório. As capturas foram feitas com Chromium sobre Vite preview, dispositivo em escala 1 e movimento reduzido, percorrendo a página para carregar as imagens lazy antes de voltar ao topo.

Regressão completa reservada para a auditoria final: esta rodada altera somente CSS restrito ao detalhe mobile, sem mudanças em componentes compartilhados ou regras funcionais. As capturas de controle e os testes direcionados verificam os riscos desta alteração.

## Arquivos

- `src/styles.css`: bloco final exclusivo do detalhe mobile.
- `tests/e2e/detail-mobile.spec.ts`: três cenários novos executados em desktop, tablet e mobile.
- `tests/e2e/auth.spec.ts`: o controle de ausência de fonte global passa do detalhe (agora com Roboto Mono no mobile) para a rota pública de página inexistente, mantendo todas as verificações anteriores de fonte e autenticação.
- `src/features/auth/assets/fonts/README.md`: registro do uso da fonte já existente.
- `README.md` e esta pasta: links, relatório e capturas.
- Baseline mobile do detalhe: atualização delimitada e justificada acima.

## Diferenças remanescentes

Descrição, ID completo, coleção, raridade, disponibilidade e três edições são os valores reais da API, diferentes do exemplo ilustrativo. Não há nota 4,8, contagem de avaliações, atributos inventados ou edição aberta: o placeholder existente continua identificado como “Em breve”. O CTA permanece “Adicionar ao carrinho”, pois não confirma uma compra. Os alvos de toque e o feedback exigem espaço adicional; em alturas menores o painel fica abaixo da dobra, com rolagem normal. Cores provisórias, sombras e microalinhamentos não receberam polimento. O arredondamento externo do dispositivo do Figma não foi reproduzido como borda da página. Testes em Chromium com toque emulado; teclado virtual e aparelhos físicos não foram testados.

Sem commit, push, deploy, Lighthouse ou avanço para outras telas.
