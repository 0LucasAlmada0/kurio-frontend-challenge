# Revisão visual 01.1 · Roboto Mono no cadastro mobile

[Comparação Figma / antes / depois · 414 × 896](comparison-414.png)

| Referência | Antes · revisão 01 | Depois · revisão 01.1 |
| --- | --- | --- |
| [Figma normalizado](figma-414.png) | [Sem Roboto Mono](before-414.png) | [Roboto Mono carregada](after-414.png) |

Outros tamanhos: [390 × 844](after-390.png) e [390 × 600](after-short.png). [Métricas anteriores](before-metrics.json) e [finais](after-metrics.json).

O PNG original de 828 × 1792 foi normalizado para 414 × 896 na revisão anterior. As imagens desta revisão são capturas em escala 1:1 do preview de produção, sem retoque. Antes de cada captura, o script aguarda `document.fonts.ready`. O teste de carregamento também confirma os pesos efetivamente carregados e as duas respostas WOFF2 locais com status 200.

## Alterações

- Roboto Mono aplicada somente a `.register-dialog` em até 600 px; a variável tipográfica global não foi alterada.
- Wordmark: 32 px, 700, line-height 42 px, letter-spacing 0.1em, foreground #F5F1EB, caixa 109 × 42.
- Título: 18 px/700, line-height 16 px, centralizado. O espaço existente de 27 px foi preservado com `min-height` e alinhamento central, mantendo o início do formulário.
- Campos: 50 px, borda #3F2319, raio 10 px e padding horizontal de 16 px; os campos de senha reservam espaço à direita para seu controle.
- Placeholders: 14 px/400, line-height 16 px, cor #B39463. Nome vazio centralizado; texto digitado/autofill alinhado ao início. O texto digitado continua com 16 px para preservar a proteção contra zoom automático de formulários no iOS.
- Botão: 16 px/700, line-height 16 px, cor #140D0A, mantendo 358 × 60, fundo #D28A4C e raio 10 px.
- Ícones de senha existentes: 18 × 18, stroke 1.5 px e #55321F. O espelhamento aproxima a direção do risco da referência. A área de toque permanece 44 × 44 e os controles continuam acessíveis.
- Textos sociais e rodapé usam a mesma família, com tamanhos de 14 e 16 px para remover as compensações da fonte anterior. As caixas e posições permanecem iguais. O login social continua desabilitado e descrito como indisponível.

As caixas medidas de logo, título, quatro campos, botão, divisória, ações sociais e rodapé são idênticas às anteriores em todos os cinco registros: 414 × 896, 390 × 844, 390 × 600, cadastro desktop e login mobile. Em 414, campos em y=312/374/436/498, grupo de 236 px e botão em y=588. Em alturas menores, o diálogo permanece rolável.

## Fonte e carregamento

WOFF2 Latin normal 400/700 obtidos do pacote público [Fontsource Roboto Mono](https://fontsource.org/fonts/roboto-mono), versão **5.3.0**, sem copiar fontes do Figma. **25.376 bytes** no total; nenhum pacote npm foi adicionado e `package.json`/lockfile permanecem inalterados.

[Origem fixa, integridade SHA-512, hashes dos arquivos e reprodução](../../src/features/auth/assets/fonts/README.md) · [Licença OFL-1.1 original](../../src/features/auth/assets/fonts/LICENSE).

O Vite emite os dois arquivos com hash em `dist/assets`; seus bytes são idênticos aos binários de origem. As declarações usam `font-display: swap`, sem preload global, itálicos, outros pesos ou chamadas externas em runtime. Os testes confirmam ausência de requisições de fontes no login e no cadastro desktop/tablet.

## Validação

- `npm.cmd run typecheck`: aprovado.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run build:demo`: aprovado, incluindo os dois WOFF2. Bootstrap continua em 496,93 kB / 161,72 kB gzip.
- `git diff --check`: aprovado.
- Regressão no build de demonstração: **45 testes aprovados em 1,8 min**, sem atualização de snapshots, falhas, ignorados ou flaky. Inclui autenticação, sessão/isolamento, estados de erro, teclado, mostrar/ocultar senha, retorno, responsividade, fonte carregada e autofill via pseudoestado real do Chromium.

```powershell
$env:E2E_PREVIEW='true'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-01-1-cadastro'
npx.cmd playwright test auth.spec.ts responsive.spec.ts --output=test-results/visual-01-1-cadastro
```

Relatório HTML local: `playwright-report/visual-01-1-cadastro/index.html` (diretório de trabalho ignorado).

Após comparação visual, apenas `register-mobile-win32.png` foi atualizada nesta revisão: substituição pela fonte real, propriedades tipográficas confirmadas, bordas, padding e ícones. O fluxo de cadastro passou nessa atualização direcionada (**1 teste, 10,5 s**). Hashes SHA-256 anteriores e posteriores confirmam que as outras cinco baselines de autenticação foram preservadas, inclusive as de desktop/tablet já revisadas na etapa anterior. Os 45 testes finais compararam as baselines sem regeneração.

## Diferenças remanescentes

A família deixou de ser uma limitação: agora é Roboto Mono. Podem permanecer diferenças de rasterização entre o PNG exportado em 2× e o Chromium no Windows, além dos traços dos vetores locais de senha/social, que não são os assets originais do Figma. A geometria dos ícones sociais não foi redesenhada nesta revisão.

O botão de fechar foi preservado por navegação/acessibilidade, e o arredondamento externo do frame não foi aplicado ao documento. O teclado virtual e as safe areas de aparelhos físicos iOS/Android não foram verificados; foram usados Chromium, foco por teclado, alturas reduzidas e autofill forçado via CDP. Nenhuma regra REST/MSW, lógica de autenticação ou outra tela foi modificada; sem commit ou deploy.
