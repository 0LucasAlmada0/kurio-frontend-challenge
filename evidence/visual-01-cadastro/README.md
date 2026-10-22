# Revisão visual 01 · Mobile / Cadastro

[Comparação Figma / antes / depois em 414 × 896](comparison-414.png)

| Referência normalizada | Implementação anterior | Implementação final |
| --- | --- | --- |
| [Figma · 414 × 896](figma-414.png) | [Antes · 414 × 896](before-414.png) | [Depois · 414 × 896](after-414.png) |

Outras alturas: [390 × 844](after-390.png), [390 × 600](after-short.png) e [390 × 500 com foco no retorno](after-short-bottom.png).

A referência é o PNG local original `design-references/mobile/cadastro.png` (828 × 1792), reduzido exatamente à metade somente para comparação. Não foi utilizado como interface. As capturas anteriores vieram do Vite local; as finais, do build de demonstração em preview. Nenhuma captura da implementação foi redimensionada ou retocada; o comparativo apenas reúne as três imagens na mesma escala.

## Correções

- Composição vertical, alinhamentos e margens laterais de 28 px em 414 px.
- Wordmark: caixa 109 × 42, texto 32 px/700, line-height 100%, letter-spacing 10% e centralização.
- Campos de 50 px; placeholder do nome centralizado quando vazio e texto digitado alinhado ao início. E-mail: “Digite seu e-mail”, mantendo o label acessível “E-mail”. Campos usam 16 px para evitar o zoom automático de formulários no Safari mobile.
- Botão de 358 × 60 px, raio 10 px. Em 414 × 896, posição y=588; campos em y=312/374/436/498; botões sociais em y=716/772 e rodapé em y=852.
- Foreground #F5F1EB e primária #D28A4C limitados ao cadastro mobile, sem modificar tokens de outras telas.
- Ícones Google/Facebook em SVG local e controle de visibilidade na confirmação. Botões sociais continuam nativamente desabilitados, com título e descrição acessível da indisponibilidade. A explicação não ocupa uma seção visual no cadastro mobile.
- O conteúdo padrão cabe em 414 × 896. Em alturas menores, erros e campos permanecem em fluxo e o diálogo permite rolagem. Foco, Escape, saída, retorno e redirecionamento foram preservados.

## Validação e baselines

`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build:demo` e `git diff --check` aprovados.

```powershell
$env:E2E_PREVIEW='true'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-01-cadastro'
npx.cmd playwright test auth.spec.ts responsive.spec.ts --output=test-results/visual-01-cadastro
```

**42 testes aprovados em 1,9 min**, sem atualização de snapshots nessa regressão. Inclui cadastro/erros/conflito REST, persistência, isolamento/expiração, favoritos, teclado, imagens sociais carregadas, medidas em 414 × 896, 390 × 844 e 390 × 500, rolagem, retorno e responsividade dos formulários existentes. O relatório HTML local está em `playwright-report/visual-01-cadastro/index.html` (diretório de trabalho ignorado).

Três baselines de cadastro foram intencionalmente revisadas com o fluxo `cadastro validado` (3 testes aprovados em 15,0 s):

- `register-mobile-win32.png`: composição, medidas, cores, tipografia, placeholders, ícones, confirmação e rodapé desta revisão.
- `register-tablet-win32.png` e `register-desktop-win32.png`: novo texto do placeholder de e-mail e estrutura compartilhada do campo de confirmação; dimensões do modal e composição desktop/tablet foram preservadas.

Nenhuma baseline de login foi alterada. A captura independente de login mobile antes/depois foi idêntica pixel a pixel. Os novos estilos são condicionados a `.register-dialog` em até 600 px; as regras que escondem os novos ícones/controle fora do mobile usam classes exclusivas desses elementos.

## Diferenças e limites

Na revisão 01 a família original ainda era desconhecida (`font/family` no Figma), e foi preservada a cadeia tipográfica existente. Posteriormente foi identificada como **Roboto Mono**: essa limitação foi resolvida na [revisão 01.1](../visual-01-1-cadastro/README.md), sem substituir as capturas históricas desta pasta. Os ícones de senha continuam baseados no conjunto local existente.

O arredondamento externo do PNG pertence ao frame exportado e não foi aplicado ao documento. O botão de fechar permanece disponível, embora não apareça no PNG do Figma. Não se adicionaram autenticação social, novas regras de negócio, commits ou deploy. Teclado e redução da área visível foram verificados no Chromium; o teclado virtual e safe areas de aparelhos físicos iOS/Android não foram testados.
