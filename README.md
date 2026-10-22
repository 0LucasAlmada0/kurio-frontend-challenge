# Kurio · Etapas 1, 1.5, 2 e 3

Marketplace com catálogo/detalhe, autenticação simulada, sessão persistida, isolamento por usuário, favoritos otimistas e carrinho com cupons e cotação precisa. REST é interceptado por MSW e preços/disponibilidade são atualizados via Socket.IO. Checkout, carteiras e pedidos permanecem fora desta etapa.

Referências: [enunciado oficial](https://github.com/junglegaming/frontend-challenge), [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) e `LEIA-ME.md`. O enunciado prevalece. Nenhuma implementação de outro candidato foi consultada.

## Carrinho e cotação

Cards permitem abrir **Escolher edição**; detalhe permite selecionar edição/quantidade e adicionar. `/carrinho` funciona com visitante e conta. Carrinho, edições e cupons persistem via fonte MSW compartilhada; login combina o visitante à conta uma única vez. Logout/troca/expiração isolam os dados privados. O resumo é integralmente fornecido pela cotação REST, com precisão de 18 casas e validação de versão. Preço/estoque mudam pelo Socket.IO existente.

Cupom demonstrável: `KURIO10` (10%); `EXPIRADO` exercita expiração; outros códigos são inválidos. **Cenários de demonstração → Carrinho e cotação** permite falha de rede/503, latência, timeout e recuperação. **Alterar Emerald Ape** atualiza a cotação com o carrinho aberto. Nenhuma alteração reserva estoque ou executa compra. **Continuar ao checkout** fica explicitamente inativo até autorização da próxima etapa.

As referências locais de carrinho orientam tabela/resumo desktop e cards/resumo mobile. Foram mantidos os assets, tokens e rodapé existentes; os blocos editoriais/newsletter/carteiras do frame não pertencem ao escopo. A ausência de fonte original e as cores provisórias continuam sendo limitações visuais documentadas.

Arquivos da Etapa 3: `src/features/cart/{identity,queries,purchase-controls,cart-link,page}`, `src/mocks/{cart-store,cart-handlers}`, contratos/fixtures/store/handlers, merge nos handlers de autenticação e cancelamento na sessão, router/shell, integração nos cards/detalhe, validação e reconciliação Socket.IO, helper ETH, ícone de remoção e CSS responsivo/autofill. Testes em `tests/e2e/cart.spec.ts`, asserções de ações atualizadas em `foundation.spec.ts` e baselines nas três pastas `*.spec.ts-snapshots`. Contratos e decisões completos em [CONTRACTS.md](CONTRACTS.md#carrinho-e-cotação--etapa-3) e [ARCHITECTURE.md](ARCHITECTURE.md#carrinho-e-cotação). Nenhuma dependência foi adicionada.

Limitações específicas: mocks persistem no navegador e não garantem transações entre abas/dispositivos; cotação não reserva estoque e usa taxa estimada fixa. O catálogo anterior migra para a fixture com edições, preservando o armazenamento de contas/favoritos. A navegação inferior mobile existente é mantida no carrinho; em capturas de página inteira, sua posição fixa corresponde ao viewport inicial. Fonte, dados e conteúdo inferior diferem do frame. O checkout futuro deverá validar a cotação no commit da operação, reservar estoque e tratar idempotência/pagamento/pedidos; nenhuma dessas ações foi implementada.

### Evidências visuais da Etapa 3

| Viewport | Carrinho | Campo com autofill e foco |
| --- | --- | --- |
| 390px | [Captura](tests/e2e/cart.spec.ts-snapshots/cart-mobile-win32.png) | [Captura](tests/e2e/cart.spec.ts-snapshots/login-autofill-mobile-win32.png) |
| 768px | [Captura](tests/e2e/cart.spec.ts-snapshots/cart-tablet-win32.png) | [Captura](tests/e2e/cart.spec.ts-snapshots/login-autofill-tablet-win32.png) |
| 1440px | [Captura](tests/e2e/cart.spec.ts-snapshots/cart-desktop-win32.png) | [Captura](tests/e2e/cart.spec.ts-snapshots/login-autofill-desktop-win32.png) |

Revisão visual local identificou e corrigiu o deslocamento das colunas/espaço superior desktop, o acesso direto ao carrinho no detalhe mobile e a sobreposição causada por preços ETH longos. As capturas são da aplicação executada no Chromium, não assets usados como implementação. Início/detalhe e login/cadastro continuam cobertos nas pastas de baselines anteriores.

### Validação final da Etapa 3

| Comando executado no PowerShell | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado; repetido também pelo script de build final |
| `npm.cmd run lint` | Aprovado após os ajustes finais |
| `npm.cmd run build:demo` | Aprovado, Vite 7.3.7, MSW habilitado |
| `$env:E2E_PREVIEW='true'; npx.cmd playwright test --project=mobile --grep 'merge no login\|isolamento entre Ana\|precisão de 18 casas\|catálogo: REST\|layout responsivo' --update-snapshots` | 5 aprovados em 24,7s após as correções mobile |
| `$env:E2E_PREVIEW='true'; npx.cmd playwright test` | **84 aprovados em 4,6min**, sem atualizar snapshots; 28 por viewport |
| `git diff --check` | Aprovado |

São 45 execuções novas (15 cenários de carrinho/cotação/autofill × 3 viewports) e 39 execuções anteriores. Incluem adição/listagem/detalhe, edições, alteração/remoção, validação de estoque na UI/REST, refresh, merge limitado e idempotente, isolamento Ana/Bruno/visitante, cupons, 18 casas e arredondamento em wei, paridade REST/UI, cotação vencida/desatualizada, sessão expirada com retorno ao carrinho, Socket.IO/versões/duplicatas/payload inválido, edição esgotada, falha de rede/503 e recuperação, resposta privada atrasada, skeleton, foco, overflow e regressão visual. Autofill é verificado via pseudo-classe real do Chromium forçada por CDP, incluindo foco, fundo e texto dos tokens. A suíte anterior preserva autenticação/favoritos, catálogo, URL/histórico e reconexão Socket.IO.

Rodadas iniciais detectaram o atalho mobile ausente e o overflow com ETH longo; ambos foram corrigidos antes da execução final. O helper de logout foi ajustado à navegação real pelo mercado. Baselines foram atualizadas intencionalmente e revisadas; a última execução comparou todas sem regeneração. Relatório final: [playwright-report/index.html](playwright-report/index.html). Sem testes desabilitados, novas dependências, commits automáticos ou avanço para checkout/carteiras/pedidos.

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

## Etapa 2 · Sessão e favoritos

Credenciais fictícias determinísticas (não use credenciais reais):

| Usuário | E-mail | Senha de demonstração |
| --- | --- | --- |
| Ana | `ana@kurio.test` | `KurioDemo!123` |
| Bruno | `bruno@kurio.test` | `KurioDemo!123` |

1. Abra **Entrar** no desktop ou o ícone de conta no mobile. **Criar conta/Crie uma conta** abre cadastro. Desktop usa modal sobre início/detalhe; mobile usa tela inteira. Social e recuperação de senha são explicitamente indisponíveis.
2. Entre como Ana, clique no coração de um card e abra **Seus favoritos**. O clique muda o estado otimisticamente; a API confirma. Recarregue para validar sessão e favoritos persistidos. No mobile, **Sair** fica no menu do ícone de conta; no desktop fica no header.
3. Saia e entre como Bruno: seus favoritos começam vazios. Volte à conta Ana e confira que os favoritos continuam associados a ela. `/favoritos` exige login e retorna a essa rota depois da autenticação.
4. Em **Cenários de demonstração → Sessão e favoritos**, `favorite-error` recusa mutations com 503 após 2s: o coração muda imediatamente e depois faz rollback com mensagem. `success` permite nova tentativa. A exclusão na lista privada também restaura o card e mostra o erro.
5. `private-slow` aplica 3s à consulta privada; `mutation-slow` aplica 2s à alteração. Faça logout durante a operação para observar cancelamento/isolamento. A suíte realiza a troca por navegação SPA, sem recarregar para esconder caches antigos.
6. **Expirar sessão** invalida a sessão no mock e reconsulta REST; o login reaparece com o destino preservado. `auth-error` produz falha 503 recuperável no login/cadastro/recuperação de sessão. Esses cenários persistem em `sessionStorage` durante refresh da aba; `success` ou **Restaurar cenário** os remove.
7. O reset geral restaura as duas contas originais, apaga contas criadas e favoritos e revoga sessões. O botão também faz logout local e recarrega. Não há commits automáticos, carrinho, checkout ou pedidos.

O cliente persiste somente um token de demonstração e confirma a identidade em GET `/session`. Senhas nunca são persistidas em texto claro; o MSW guarda salt/hash PBKDF2. A sessão expira após 30 minutos, é revalidada ao foco e é revogada ao sair. Logout em outra aba também encerra o acesso privado. Contratos, cache, cancelamento e limitações estão em [CONTRACTS.md](./CONTRACTS.md) e [ARCHITECTURE.md](./ARCHITECTURE.md).

Esta autenticação é uma simulação local: o armazenamento e o Bearer token são inspecionáveis no navegador. Não substitui autenticação de produção com backend/cookie seguro. Escritas simultâneas entre abas não têm transações. A detecção de expiração remota depende de REST/foco/timer; não há eventos privados nesta etapa.

Arquivos principais: `features/auth/{session,lifecycle,page,validation}`, `features/favorites/{queries,use-favorite,favorite-button,page}`, `mocks/{auth-store,auth-handlers,auth-scenarios}`, router/shell, integrações de favoritos nos cards/galeria/detalhe e `tests/e2e/auth.spec.ts`. Sem novas dependências. Capturas de login/cadastro em `tests/e2e/auth.spec.ts-snapshots/`, nos três viewports; início/detalhe continuam em `foundation.spec.ts-snapshots/`.

### Validação da Etapa 2

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Aprovado, strict |
| `npm run lint` | Aprovado |
| `npm run build:demo` | Aprovado, MSW incluído no build |
| `npm run test:e2e -- --update-snapshots` | 39 aprovados em 2,0min; baselines revisadas |
| `$env:E2E_PREVIEW='true'; npm run test:e2e` | 39 aprovados em 1,6min no build otimizado, sem atualizar baselines |
| `$env:E2E_PREVIEW='true'; npm run test:e2e -- auth.spec.ts --grep favoritar/desfavoritar` | 3 aprovados em 12,2s após ajuste final da posição do erro na galeria; erro confirmado dentro do viewport |
| `git diff --check` | Aprovado |

São 27 execuções novas de auth/favoritos e 12 da regressão existente, em 390/768/1440px. Cobrem cadastro/validação/conflito, login incorreto e falha 503 recuperável, retorno ao detalhe, persistência, logout/401, autorização 403 entre contas, troca de usuários sem refresh, consulta cancelada, mutation atrasada com barreira de conclusão, rollback de inclusão/remoção no catálogo/detalhe/lista, duplo clique com somente uma requisição, expiração e logout entre abas. A regressão mantém catálogo, REST/MSW, busca/paginação/histórico, reduced motion, eventos Socket.IO reais, versões antigas e reconexão.

O relatório completo foi preservado em [playwright-report/index.html](playwright-report/index.html). A verificação final de detalhe usou `PLAYWRIGHT_HTML_OUTPUT_DIR=playwright-report/detail` e `--output=test-results/detail`, com relatório em [playwright-report/detail/index.html](playwright-report/detail/index.html). Os testes não manipulam cache/hooks para simular sucesso. Nenhum teste foi desabilitado.
