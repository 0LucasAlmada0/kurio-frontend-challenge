# KURIO | Kit visual para o Codex

**Fonte funcional obrigatória:** https://github.com/junglegaming/frontend-challenge
**Fonte visual oficial:** https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1

## Conteúdo
- `design-references/mobile/`: seis capturas de telas mobile.
- `design-references/desktop/`: oito capturas de telas desktop; cadastro e login estão representados como modais sobre a home.
- `design-assets/nfts/`: quatro imagens originais de NFTs, exportadas pelo candidato.

O frame isolado `Desktop / Início` ainda não está incluído. A tela de início aparece parcialmente por trás dos modais de login/cadastro, e os demais componentes desktop estão visíveis nas outras capturas. Não inventar que possuímos todas as 15 telas isoladas.

## Tokens preliminares
- Fundo preto/marrom muito escuro, painéis chocolate escuro, laranja/cobre nos CTAs, textos brancos e bege.
- Paleta inferida visualmente: os valores hexadecimais EXATOS ainda serão fornecidos após inspeção do Figma. Usar tokens CSS (variáveis) para facilitar substituição.
- Tipografia com aparência monoespaçada. `font/family` parece nome de variável/token no Figma, NÃO prova da família real. Manter `--font-kurio` com fallback monospace até descobrir a fonte.

## Como usar
1. Deixe esta pasta no workspace do Codex antes do primeiro prompt.
2. Leia `README.md` do desafio **na URL oficial**, de modo integral, antes de fazer código.
3. Para componentes do produto, use imagens de `design-assets/nfts/` copiadas em `public/assets/nfts/`; referencie caminhos locais. Não renderize um print de tela como UI.
4. Outras variações de NFT do Figma reutilizam personagens; a fixture pode reutilizar imagem, mantendo títulos/preços coerentes e dados consistentes. Evite imagens externas ou geradas sem autorização.
5. Não copie soluções de forks, pull requests ou comentários de outros candidatos.
6. Não simule sucesso de ações não implementadas. Respeite as especificações de mocks REST, Socket.IO e testes E2E do README.
7. Esta pasta é material de referência: não incluir screenshots dos frames no bundle público de produção se eles não forem necessários.

## Observações visuais
- Desktop: topo horizontal; home com hero, sidebar, grid e footer; auth abre como modal; carrinho/checkout usam duas colunas.
- Mobile: home com busca e tabs, nav inferior; auth ocupa tela; ações de compra/checkout na parte inferior.
- A versão final deve ser responsiva a 390, 768 e 1440px e adaptar telas sem frame mobile próprio.
- O texto e os números das capturas podem ser ilustrativos e conter divergências. A API mockada e os contratos são a fonte de verdade do estado e dos cálculos.
