# Kurio · Etapas 1 e 1.5

Fundação executável do marketplace com alinhamento visual de início e detalhe às referências locais, REST simulado e atualização por Socket.IO. Não inclui autenticação, carrinho, checkout nem as demais telas. Os espaços dessas ações são explicitamente inativos.

Referências: [enunciado oficial](https://github.com/junglegaming/frontend-challenge), [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) e `LEIA-ME.md`. O enunciado prevalece. Nenhuma implementação de outro candidato foi consultada.

## Instalação e comandos

Node >= 22.12 e npm. No PowerShell com scripts bloqueados, use `npm.cmd`/`npx.cmd`.

```sh
npm ci
npx playwright install chromium
npm run dev
npm run typecheck
npm run lint
npm run build:demo
npm run preview
npm run test:e2e
npm run test:e2e:report
```

O desenvolvimento abre em `http://127.0.0.1:5173`. Os testes iniciam seu servidor na porta 4173 e usam contextos Chromium isolados em 1440, 768 e 390px. Relatório HTML em `playwright-report/`; screenshots e traces de falhas em `test-results/`.

Os snapshots de início e detalhe ficam junto aos testes. Para regenerá-los intencionalmente: `npm run test:e2e -- --update-snapshots`. Baselines dependem do sistema operacional e da versão do Chromium; as incluídas foram geradas no Windows, com o navegador instalado pela versão do Playwright fixada no lockfile.

Para validar a demo compilada, execute `npm run build:demo` e depois, no PowerShell, `$env:E2E_PREVIEW='true'; npm run test:e2e`. Remova a variável com `Remove-Item Env:E2E_PREVIEW` para voltar ao servidor de desenvolvimento. O modo preview não reutiliza um dev server existente.

## Configuração

Veja `.env.example`. `VITE_ENABLE_MOCKS=true` habilita MSW e seus controles. Em desenvolvimento os mocks são ligados por padrão; `false` os desliga. `npm run build:demo` usa `.env.demo` para habilitá-los no build. `npm run build` gera a variante sem mocks habilitados, que exige uma API REST e um serviço Socket.IO compatíveis.

`VITE_API_BASE_URL` configura o prefixo REST (padrão `/api`); `VITE_SOCKET_URL` configura a origem Socket.IO (padrão origem da página). As variáveis Vite são públicas e definidas no build; não coloque segredos nelas. A demo não depende de backend nem conta privada.

`public/mockServiceWorker.js` é versionado. Ao atualizar MSW, execute `npx msw init public --save`. O worker exige localhost ou HTTPS. A aplicação aguarda sua inicialização antes de montar React e conectar o socket.

## Reprodução

1. Abra **Cenários de demonstração** e clique em **Restaurar cenário**. O reset restaura fixtures e cenário de rede e recarrega a página, limpando cache e conexão anteriores.
2. O Emerald Ape inicia em **1.19 ETH**, versão 1, com 8 edições.
3. Clique em **Alterar Emerald Ape**. O handler grava **1.49 ETH**, versão 2, com 7 edições, e emite `nft.updated` pelo binding Socket.IO. A interface anuncia o evento e atualiza a consulta. Abra o detalhe para conferir o mesmo valor.
4. Recarregue: o estado do catálogo persiste no armazenamento local. O próximo clique alterna para 1.19 ETH e incrementa a versão novamente.
5. Selecione `empty`, `error`, `slow`, `variable`, `offline` ou `timeout` para exercitar rede e feedback. `success` recupera a API. `variable` usa a paridade do comprimento da busca para latências reproduzíveis. No erro há **Tentar novamente**.

Busca, ordenação e página pertencem à URL. Exemplo direto: `/nfts/emerald-ape-042`; identificadores inexistentes mostram o erro da API. O contrato completo e controles HTTP estão em [CONTRACTS.md](./CONTRACTS.md).

## Auditorias futuras

```sh
npm run build:demo
npm run audit
```

Para desktop no PowerShell: `$env:LH_PROFILE='desktop'` antes de `npm run audit`; remova a variável para mobile. Requer Chrome disponível (ou `CHROME_PATH`). A configuração versionada executa três medições em início e detalhe no preview otimizado, agrega a mediana e salva HTML/JSON em `.lighthouseci/`. Metas: performance/SEO 90, acessibilidade/boas práticas 95. Nesta etapa a auditoria foi preparada; nenhuma pontuação é declarada.

## Publicação futura e limites

Vercel tem fallback em `vercel.json`; Netlify/Cloudflare Pages podem usar `public/_redirects` com prioridade dos arquivos existentes. O host deve servir assets e service worker como arquivos, e rotas da aplicação como `index.html`. A demo exige `npm run build:demo`, diretório `dist` e HTTPS. As rotas `/api/*` devem chegar à API quando mocks estiverem desativados. Nenhum deploy foi realizado nesta etapa.

Tokens são aproximações das capturas. A família real ainda não foi identificada: `--font-kurio` usa Consolas/Liberation Mono/Courier New/monospace. O conector Figma negou leitura por falta de acesso de edição na Etapa 1; as capturas locais foram usadas conforme o kit. Não há alegação de fidelidade final.

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para cache, transporte, limites e próximos passos. As funcionalidades futuras ainda exigem os fluxos, cenários e testes completos do desafio oficial.

## Validação executada em 21/10/2026

Ambiente: Windows, Node 24.14.1, npm 10.6.0, Playwright 1.64.1, Chromium 156.0.8078.4 (revisão 1248), Vite 7.3.7. Dependências exatas em `package-lock.json`.

| Comando / verificação | Resultado |
| --- | --- |
| `npm ci --no-audit --no-fund` | Instalação limpa aprovada, 587 pacotes |
| `npm run typecheck` | Aprovado, TypeScript strict |
| `npm run lint` | Aprovado |
| `npm run build:demo` | Aprovado, inclui worker, assets e fallback SPA |
| `npm run test:e2e -- --update-snapshots` | 12 testes aprovados em 36,2s; 1440/768/390px, seis baselines criadas |
| `$env:E2E_PREVIEW='true'; npm run test:e2e -- --project=desktop --grep REST` | 2 testes aprovados em 14,6s na demo compilada, com comparação das baselines |
| Hashes SHA-256 dos quatro assets copiados | Idênticos aos originais |

O relatório HTML mais recente está em `playwright-report/index.html`. REST foi confirmado como resposta de service worker no teste do build. A prova Socket.IO confirmou preço 1.19 → 1.49 ETH, versão 1 → 2, disponibilidade 8 → 7 e igualdade do recurso entre evento e REST. Também passaram descarte de eventos duplicados/antigos/inválidos, atualização de detalhe, recuperação de evento perdido após reconexão, conexão após 35s de relógio controlado e persistência no refresh. A suíte maior verificou estados vazio/erro/loading, reduced motion, URL/histórico, acesso direto e ausência de overflow nos três viewports.

Correções verificadas durante a implementação: importação de Socket.IO posterior à inicialização MSW; handler compatível com a normalização de URL no MSW 2.15; API `toSocketIo` do binding publicado. As falhas iniciais de conexão foram resolvidas; nenhum teste foi desabilitado para obter aprovação.

## Etapa 1.5 · Alinhamento visual

Header desktop, hero distinto por viewport, sidebar com filtros em preparação, grid de três colunas no desktop e duas escalonadas no mobile, navegação inferior com cinco posições e detalhe com galeria/painel/áreas de interação. Ações futuras usam controles desativados e avisos de indisponibilidade. A busca desktop abre pelo ícone do header; a mobile permanece no topo. Tokens de cores continuam provisórios; o fallback tipográfico foi ajustado sem adicionar fontes externas.

Arquivos principais: `src/styles.css`, `src/app/shell.tsx`, páginas de `src/features/catalog/`, `NFTCard`, `NftGallery`, `FilterGroup`/`FilterOption`, `Icon` e `RelatedNfts`. Sem dependências novas nem alterações em REST, contratos, fixtures, cache ou implementação Socket.IO. Os relacionados reutilizam a consulta pública existente.

Validação final: `npm run typecheck`, `npm run lint` e `npm run build:demo` aprovados. Suíte em desenvolvimento: **12 aprovados (39,7s)**. Após a revisão das seis capturas e o ajuste final do ícone mobile, executado `$env:E2E_PREVIEW='true'; npm run test:e2e`: **12 aprovados (31,2s)** no build otimizado, sem atualizar baselines. Confirmados REST/MSW, URL/histórico, navegação direta, preço via Socket.IO, duplicatas/eventos antigos, reconexão, persistência, reduced motion e ausência de overflow em início/detalhe. Ações de compra e quantidade também foram verificadas como desativadas. Relatório HTML: `playwright-report/index.html`.

| Largura | Início | Detalhe |
| --- | --- | --- |
| 390px | [Captura](tests/e2e/foundation.spec.ts-snapshots/catalog-mobile-win32.png) | [Captura](tests/e2e/foundation.spec.ts-snapshots/detail-mobile-win32.png) |
| 768px | [Captura](tests/e2e/foundation.spec.ts-snapshots/catalog-tablet-win32.png) | [Captura](tests/e2e/foundation.spec.ts-snapshots/detail-tablet-win32.png) |
| 1440px | [Captura](tests/e2e/foundation.spec.ts-snapshots/catalog-desktop-win32.png) | [Captura](tests/e2e/foundation.spec.ts-snapshots/detail-desktop-win32.png) |

Diferenças remanescentes: início desktop isolado ausente (comparação feita com o fundo do modal); fonte exata desconhecida; dados/ordenação da API diferentes dos exemplos visuais; somente uma vista por NFT; avaliações/atributos sem contrato não inventados; footer e conteúdo inferior mantidos dentro do escopo. A comparação detalhada está em [ARCHITECTURE.md](./ARCHITECTURE.md#comparação-visual-e-diferenças-remanescentes). Sem commits automáticos e sem avanço à Etapa 2.
