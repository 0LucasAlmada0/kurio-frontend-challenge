# Revisão estrutural 05 · Home

Diagnóstico registrado antes da implementação, a partir do build de demonstração. Referências: frame Desktop / Início anexado à solicitação e [Mobile / Início](../../design-references/mobile/inicio.png). O PNG desktop não está no diretório local; sua referência é a imagem fornecida na conversa. Não foi recriado nem usado como implementação.

| Prioridade | Divergência inicial | Encaminhamento |
| --- | --- | --- |
| Crítica | Nenhuma falha funcional identificada na inspeção inicial. | Preservar contratos e testar regressão. |
| Alta | Dois banners ausentes depois da paginação. | Compor com imagens locais e acesso ao catálogo existente. |
| Alta | Diário da Cunhagem inteiramente ausente. | Apresentar quatro prévias editoriais, sem inventar artigos ou publicação. |
| Alta | Informações complementares e newsletter ausentes. | Reproduzir composição; inscrição explicitamente indisponível. |
| Alta | Rodapé reduzido a uma faixa, sem grupos de navegação. | Completar somente na Home, distinguindo destinos existentes de conteúdo futuro. |
| Média | Continuidade interrompida por indicadores e controles de demonstração logo após a listagem. | Posicioná-los depois das novas seções, preservando seu funcionamento. |
| Média | Conteúdo, quantidade e ordem dos cards/filtros diferem das ilustrações. | Preservar REST, ordenação, oito resultados por página e filtros reais. |
| Média | Destaque promocional na sidebar não existe. | Pendente: não há contrato de oferta limitada que sustente a promoção ilustrada. |
| Média | Texto resumido do hero desktop e tipografia provisória em componentes já existentes. | Preservar componentes aprovados; não realizar polimento nesta rodada. |
| Baixa | Microalinhamentos, sombras, paginação ilustrativa e detalhes decorativos. | Fora do escopo estrutural. |

As referências mobile mostram somente a primeira dobra. A distribuição das seções inferiores no mobile adapta a estrutura desktop; não existe um frame mobile completo para comparar essa parte.

## Comparações e implementação

[Índice visual Figma / Antes / Depois](index.html), [comparação mobile 414](comparison-mobile-414.png) e [antes/depois desktop](comparison-desktop.png). O original desktop continua sendo o anexo da conversa; uma tentativa de leitura pelo conector oficial retornou falta de acesso ao arquivo. Não foi recriado um PNG para preencher essa lacuna.

| Viewport | Página inteira antes | Página inteira depois |
| --- | --- | --- |
| 1440 × 1000 | [2367 px de altura](desktop-before.png) | [3902 px de altura](desktop-after.png) |
| 414 × 896 | [2255 px de altura](mobile-414-before.png) | [4975 px de altura](mobile-414-after.png) |
| 390 × 844 | [2207 px de altura](mobile-390-before.png) | [5087 px de altura](mobile-390-after.png) |

[Métricas antes](before-metrics.json), [depois](after-metrics.json) e [verificação visual](visual-verification.json): sem overflow horizontal, fontes carregadas e imagens visíveis decodificadas nas três larguras. A primeira dobra mobile permaneceu **pixel a pixel igual** em 414 e 390 px.

- Dois banners com imagens Emerald/Ivory e links reais para o catálogo, preservando os parâmetros da URL.
- Diário da Cunhagem com quatro prévias em lista semântica, imagens locais na ordem do frame e leitura explicitamente indisponível. Datas e tempos de leitura ilustrativos não foram apresentados como publicações reais.
- Faixa com segurança, criadores, alertas e newsletter. Campo e envio desabilitados com descrição acessível e aviso visível; nenhum serviço novo.
- Rodapé em grupos com destinos existentes (perfil, carteiras, favoritos, carrinho e catálogo). Ajuda e redes futuras são conteúdo estático identificado; nenhum link falso. Contatos ilustrativos foram substituídos pela identificação da demonstração.
- Continuidade entre informações/newsletter e rodapé. Status Socket.IO e ferramentas de demonstração preservados após o rodapé.
- Duas colunas de banners/quatro prévias no desktop, duas prévias por linha no tablet/mobile, banners e faixa informativa empilhados no mobile. Foco do rodapé reutiliza a proteção existente contra sobreposição da navegação fixa.

`Shell` monta os novos componentes exclusivamente no pathname `/`. O catálogo usado como fundo dos modais de autenticação não recebe essas seções nem o novo rodapé. Nenhum contrato, fixture, helper financeiro, autenticação, query ou listener foi alterado. Nenhuma dependência ou asset novo; a comparação contém somente cópias/capturas, não imagens usadas na implementação.

## Baselines

Após comparar as capturas, foram atualizadas somente as três imagens `catalog-{desktop,tablet,mobile}-win32.png` de `foundation.spec.ts`: sua página inteira passa a conter as seções novas e o rodapé completo; desktop/tablet também recebem a linha de header e os indicadores estáticos do hero. A primeira dobra mobile permanece igual. O teste passa a percorrer as imagens lazy antes da captura, aguardar seu carregamento e voltar ao topo; a asserção de detalhe permanece intacta. A conferência de hashes confirmou que nenhuma baseline de cadastro, login, detalhe, carrinho, pagamento ou pedido mudou.

## Arquivos e verificações

- `src/features/catalog/home-sections.tsx` e `home-sections.css`: composição e adaptação responsiva das seções novas.
- `src/app/shell.tsx`: montagem exclusiva na Home, rodapé condicional e ferramentas após o conteúdo.
- `tests/e2e/home.spec.ts`: ordem, ações disponíveis/indisponíveis, fonte local, imagens, URL, teclado, proteção do foco e ausência de overflow; inclui 414 × 896, 390 × 844 e 390 × 600 no projeto mobile.
- `tests/e2e/foundation.spec.ts` e três baselines `catalog`: captura com imagens lazy carregadas; verificações do detalhe preservadas.
- `tests/e2e/auth.spec.ts`: controle de fonte global em uma aba isolada no detalhe, preservando todas as asserções de login/cadastro. A Home agora usa Roboto Mono nas seções novas, e o `beforeEach` abre a Home; a aba separada evita contar downloads desse preparo como se fossem do detalhe.
- `src/features/auth/assets/fonts/README.md`, README principal e esta pasta: origem/uso da fonte, links e evidências.

Typecheck, lint, `build:demo` e `git diff --check` aprovados. A atualização delimitada das baselines passou nos três projetos (13,8s). Os seis testes de Home/fonte passaram (14,1s), incluindo a preservação da família tipográfica das outras telas.

**Regressão completa final: 276 testes aprovados em 10,2 minutos**, com três workers, sem falhas, skips ou retries. Os 273 cenários existentes e as três execuções novas da Home passaram no build de demonstração, incluindo autenticação, filtros, favoritos, carrinho, checkout, pedidos, isolamento, recuperação, REST/MSW e Socket.IO. O [registro extraído dos relatórios reais](visual-verification.json) preserva também as rodadas anteriores. Das 24 baselines existentes, apenas as três do catálogo foram alteradas; as outras **21 permanecem idênticas** por SHA-256, sem adições ou remoções.

Na primeira rodada direcionada, 62 de 63 testes passaram; o novo teste mantinha o mesmo link focado enquanto rolava as imagens e mudava o viewport, sem gerar outro evento de foco. Foi acrescentada a saída de foco antes da próxima verificação, mantendo as asserções de visibilidade e sobreposição; os três projetos passaram na repetição. A primeira regressão completa parou com 13 aprovados, 1 falha, 2 interrompidos e 260 não executados, pela expectativa antiga de nenhum download de fontes na Home. A primeira adaptação ainda capturava downloads pendentes do `beforeEach` (4 aprovados/2 falhas); a aba isolada resolveu essa contaminação sem alterar a aplicação.

Reprodução no PowerShell, a partir do build final:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build:demo
git diff --check
$env:E2E_PREVIEW='true'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-05-direcionados'
npx.cmd playwright test home.spec.ts catalog.spec.ts responsive.spec.ts --output=test-results/visual-05-direcionados
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-05-final'
npx.cmd playwright test --workers=3 --max-failures=1 --output=test-results/visual-05-final
```

Relatórios HTML completos permanecem locais em `playwright-report/visual-05-final/index.html` e demais pastas `visual-05-*`, ignorados pelo Git. Capturas, comparações e métricas desta pasta são versionáveis. Não foi executado commit, push, deploy ou Lighthouse.

Os links locais do índice e deste relatório foram inspecionados e não apresentam destinos ausentes. `git status` identifica os componentes, testes, documentos e evidências novos/modificados; `git check-ignore` confirma que esta pasta e seus arquivos não estão ignorados. Nada foi adicionado ao staging.

## Pendências e limites

Oferta limitada na sidebar, contatos e redes sociais reais continuam pendentes de dados/serviços válidos. Os cards e filtros mantêm estoque, edição, paginação e ordenação REST reais, diferentes da distribuição ilustrativa do Figma. Não foram implementadas páginas editoriais, inscrição em newsletter ou um carrossel novo. Microalinhamentos, sombras, fonte dos componentes antigos e recortes dos assets ficam para uma revisão autorizada.

O build passou a emitir aviso de chunk principal acima de 500 kB: 504,16 kB minificado (163,54 kB gzip), ante 497,36 kB (161,82 kB gzip). As seções adicionam cerca de 6,8 kB minificados; não foi iniciado outro trabalho de otimização nem executado Lighthouse. As notas anteriores não foram medidas novamente. Teclado/touch são emulados no Chromium; aparelhos físicos e teclado virtual não foram validados.
