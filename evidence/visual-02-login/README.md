# Revisão visual 02 · Mobile / Login

[Comparação Figma / antes / depois · 414 × 896](comparison-414.png)

| Figma | Antes | Depois |
| --- | --- | --- |
| [Referência normalizada](figma-414.png) | [Login anterior](before-414.png) | [Login ajustado](after-414.png) |

Outras capturas: [390 × 844](after-390.png), [390 × 500](after-short.png) e [390 × 500 com foco no cadastro](after-short-bottom.png). [Métricas anteriores](before-metrics.json) e [finais](after-metrics.json).

O PNG local `design-references/mobile/login.png` tem 828 × 1792 e foi normalizado à metade. O print fornecido da aplicação mostrava 432 × 868 no inspetor; a comparação usa novas capturas em 414 × 896. Antes e depois foram capturados no preview do build de demonstração, sem retoques e após `document.fonts.ready`. A montagem mantém as três imagens na mesma escala.

## Diferenças corrigidas

- Wordmark, título, margens, campos, recuperação, CTA, bloco social e cadastro redistribuídos conforme o frame. Não se adicionou altura fixa ao formulário/conteúdo: erros e mensagens permanecem no fluxo, com rolagem do diálogo nas telas menores.
- Roboto Mono 400/700 e os SVGs Google/Facebook reutilizados da revisão 01.1. Nenhuma nova fonte, pacote ou dependência. Os dois pesos são compartilhados pelo login/cadastro mobile, sem aplicar a família globalmente ou ao desktop.
- Campos de 50 px, borda #3F2319, raio 10 e padding de 16 px. Placeholders de 14 px e texto digitado de 16 px, mantendo foco e autofill. Ícone de senha de 18 × 18 com stroke de 1,5 px e alvo de toque de 44 × 44.
- CTA de 358 × 60 em 414 px, raio 10, Roboto Mono 16/700, fundo #D28A4C e foreground #140D0A. Título 20/700 e line-height 27; wordmark 32/700 e line-height 42.
- “Esqueceu a senha?” permanece nativamente desabilitado, com título e descrição acessível da indisponibilidade. O sufixo “· em breve” fica oculto apenas no mobile. Nenhum fluxo de recuperação foi criado.
- Botões sociais continuam desabilitados, com descrição acessível e tooltip. Ícones existentes e aparência da referência, sem o aviso permanente inferior. No login, o cursor de indisponibilidade e os tooltips continuam acessíveis ao ponteiro.
- Cores do link de recuperação (#E89B55), textos sociais/rodapé (#CFB28C) e bordas sociais conferidas no PNG original. Fechar, Escape, retorno à rota solicitada, estados de erro e autenticação foram preservados.

| Elemento · 414 × 896 | Antes · y / altura | Depois · y / altura |
| --- | --- | --- |
| Wordmark | 116 / 48 | 128 / 42 |
| Título | 236 / 30 | 251 / 27 |
| E-mail | 300 / 47 | 312 / 50 |
| Senha | 359 / 47 | 374 / 50 |
| Recuperação | 418 / 18 | 436 / 20 |
| CTA | 472 / 57 | 492 / 60 |
| Divisória | 567 / 19,5 | 590 / 20 |
| Google | 600,5 / 40 | 620 / 40 |
| Facebook | 654,5 / 40 | 676 / 40 |
| Link de cadastro | 769 / 21 | 756 / 24 |

Cadastro: a captura independente de 414 × 896 antes/depois é **idêntica pixel a pixel**, e os registros de dimensões, fontes, cores e rolagem também são iguais. Os estilos equivalentes apenas passaram a aceitar `.login-dialog`; as exceções do login são locais. No desktop, ícones novos continuam ocultos e o sufixo de recuperação permanece visível; não houve mudança estrutural ou atualização de baselines.

## Testes realizados

- `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build:demo` e `git diff --check`: aprovados.
- **48 testes de autenticação e responsividade aprovados em 1,9 min** no build final, sem atualizar snapshots.
- **3 testes de autofill aprovados** em 390/768/1440 px, sem atualizar snapshots.
- O teste específico de login cobre campos inicialmente vazios, indisponibilidade acessível, ícones carregados, geometria, teclado, mostrar/ocultar senha, validação, cadastro, Escape, fechar e retorno em 414 × 896, 390 × 844 e 390 × 500.
- Regressão inclui o cadastro 01.1, sessão, isolamento, expiração, favoritos/rollback, dados privados atrasados e formulários responsivos. O teste da fonte confirma carregamento local dos dois pesos e ausência de aplicação global ou no desktop/tablet.

```powershell
$env:E2E_PREVIEW='true'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-02-login'
npx.cmd playwright test auth.spec.ts responsive.spec.ts --output=test-results/visual-02-login
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-02-autofill'
npx.cmd playwright test cart.spec.ts --grep 'autofill mantém' --output=test-results/visual-02-autofill
```

Relatórios HTML locais em `playwright-report/visual-02-login/index.html` e `playwright-report/visual-02-autofill/index.html`; são diretórios de trabalho ignorados pelo Git.

Somente duas baselines foram intencionalmente revisadas, após comparação com o Figma: `auth.spec.ts-snapshots/login-mobile-win32.png` (composição, tipografia, campos e ícones) e `cart.spec.ts-snapshots/login-autofill-mobile-win32.png` (mesma interface com pseudoestado de autofill). A atualização direcionada passou nos dois testes. Hashes SHA-256 confirmam que todas as demais baselines desses conjuntos, incluindo cadastro e desktop/tablet, permaneceram iguais ao início desta revisão. A regressão final comparou sem regeneração.

## Diferenças remanescentes

- O Figma ilustra e-mail/senha preenchidos e senha em foco. A aplicação e as capturas comparativas permanecem vazias; nenhuma credencial é preenchida automaticamente, e o foco visível real foi preservado.
- O botão de fechar foi mantido. O arredondamento externo do dispositivo/frame não foi aplicado ao documento.
- Os vetores locais reutilizados podem diferir nos detalhes dos originais do Figma; a exportação em 2× e a rasterização do Chromium/Windows também podem produzir pequenas diferenças de antialiasing.
- Validação feita em Chromium com toque, teclado e alturas reduzidas. Teclado virtual e safe areas de aparelhos físicos iOS/Android não foram testados. Recuperação de senha e autenticação social continuam indisponíveis.

Arquivos desta revisão: `src/features/auth/page.tsx`, `src/styles.css`, `tests/e2e/auth.spec.ts`, documentação da fonte, as duas baselines de login e esta pasta de evidências. Nenhuma regra de autenticação, sessão, validação, REST/MSW ou retorno foi alterada. Sem commit ou deploy e sem avanço para outras telas.
