# Contratos · Etapas 1, 2, 3 e 4

Tipos executáveis: `src/api/contracts.ts`. JSON UTF-8. Os endpoints da simulação são interceptados por MSW e não requerem servidor. `/api` é o prefixo padrão.

## NFT

`Nft`: `id`, `name`, `image` (caminho local), `collection`, `creator`, `rarity` (`comum|raro|lendário`), `priceEth` (string decimal de até 18 casas), `available` (inteiro >= 0), `version` (inteiro monotônico > 0), `description`, `editions` (IDs, rótulos e estoques).

Preço nunca deve ser convertido a Number para cálculo. Ordenação e cotação usam wei/BigInt. A cotação inclui taxa de rede simulada e é revalidada dentro da criação do pedido.

| Método / rota | Entrada | Saída |
| --- | --- | --- |
| GET `/api/nfts` | `q` string, `page` inteiro >=1, `sort=name|price-asc|price-desc` | `{ items: Nft[], total, page, pageSize: 8 }` |
| GET `/api/nfts/:id` | Identificador estável | `Nft` ou 404 |

Busca ignora maiúsculas e consulta nome/coleção; sort é estável por ID no empate de preços. Página além da última retorna lista vazia mantendo `total`. Router normaliza busca inválida para string vazia, página 1 e ordenação `name`; a UI limita busca a 120 caracteres. Mudança de busca/ordenação reinicia página. AbortSignal cancela chamadas obsoletas.

Erros: `{ code: string, message: string, fields?: Record<string,string> }`. `NOT_FOUND` (404), `UNAVAILABLE` (503). Rede indisponível/timeout geram erros de transporte, sem JSON de sucesso. Recursos de sessão, favoritos, carrinho, carteiras e pedidos estão documentados abaixo; perfil e edição dedicada de carteiras permanecem para etapa posterior.

## Autenticação e favoritos

`User = {id, name, email}`. `Session = {id, token, user: User, expiresAt}`; `expiresAt` é ISO 8601, 30 minutos após criação. Token e ID são UUIDs novos a cada login/cadastro. Somente o token é persistido pelo cliente; a identidade é recuperada via REST. `Favorites = {userId, sessionId, nftIds: string[]}`.

| Método / rota | Entrada | Resultado |
| --- | --- | --- |
| POST `/api/users` | `{name,email,password,confirmPassword}` | 201 + Session; 422 por validação, 409 por e-mail existente |
| POST `/api/session` | `{email,password}` | 200 + Session; 401 por credenciais inválidas, 422 por formato |
| GET `/api/session` | Bearer token | Session ou 401 por token ausente, revogado ou expirado |
| DELETE `/api/session` | Bearer token anterior | 204; revoga exclusivamente esse token, operação idempotente |
| GET `/api/users/:userId/favorites` | Bearer token | Favorites; 401 sem sessão válida, 403 se o ID não pertence à sessão |
| PUT `/api/users/:userId/favorites/:nftId` | Bearer token, sem body | Favorites; inclusão idempotente |
| DELETE `/api/users/:userId/favorites/:nftId` | Bearer token, sem body | Favorites; remoção idempotente |

Favoritos também retornam 404 para NFT inexistente e 503 no cenário de recusa. O MSW valida a sessão e o usuário na entrada e revalida a sessão depois da latência, antes de ler/gravar. Um token revogado durante a espera não autoriza a operação. IDs de usuário arbitrários na URL não concedem acesso. Login/cadastro com um Bearer anterior o revoga ao criar a nova sessão.

Validação compartilhada por formulário e handler: nome com 2–60 caracteres, e-mail válido com até 254 caracteres, senha de cadastro com 8–128 caracteres e confirmação igual. Login exige senha não vazia com até 128 caracteres. E-mail é normalizado para minúsculas sem espaços nas extremidades. Erros de campos vêm em `fields` e são associados aos inputs. Senhas são derivadas com PBKDF2/SHA-256, salt por usuário e 600.000 iterações; o mock persiste apenas salt/hash. Não há autenticação social ou recuperação de senha simulada.

Rotas UI: `/login` e `/cadastro`, com `redirect` interno normalizado e `reason=expired` opcional; `/favoritos` exige sessão. Redirecionamentos externos e ciclos para as rotas de auth são rejeitados. O login retorna à rota solicitada, incluindo busca/hash. Favoritar como visitante abre login, sem realizar a mutation até um novo clique autenticado.

### Controles de sessão/favoritos

| POST sob `/api/__mock/auth` | Body / comportamento |
| --- | --- |
| `/scenario` | Campos opcionais `{authFailure, favoritesFailure, privateDelay, mutationDelay}`; booleanos e latências de 0 a 6000ms. Padrão: false/false/120/350 |
| `/expire` | Expira todas as sessões da simulação; próxima consulta REST as rejeita |
| `/idle` | Aguarda latências privadas já em andamento; barreira determinística para testes de logout com operações pendentes |

Os cenários de auth ficam em `sessionStorage` e sobrevivem ao refresh da aba, até reset. O reset geral restaura usuários originais, remove contas cadastradas, sessões e favoritos e restaura os cenários. A UI oferece `auth-error`, `favorite-error`, `private-slow` e `mutation-slow` em **Sessão e favoritos**, além de **Expirar sessão**.

## Carrinho e cotação · Etapa 3

Todas as rotas abaixo usam o mesmo proprietário: `Authorization: Bearer <token>` resolve a conta no servidor simulado; credenciais inválidas retornam 401 e nunca caem no carrinho visitante. Sem bearer, exige-se `X-Guest-Cart: guest:<UUID>`, uma capacidade opaca de demonstração. O body não seleciona usuário. A autorização é verificada novamente após a latência. Capacidades já mescladas retornam 410.

| Método / rota sob `/api` | Contrato |
| --- | --- |
| GET `/cart` | `Cart {ownerId, version, items: [{nftId, editionId, quantity,lineId?}], coupon: string|null, notices: string[]}`; lineId gerado pelo servidor identifica a linha para limpeza após compra |
| PUT `/cart/items` | `{nftId, editionId, quantity, operation?: 'add'|'set'}`; `set` é padrão, `add` soma; retorna Cart. Quantidade inteira 1–10000; 422 para inválida, 404 edição ausente, 409 estoque insuficiente/esgotado |
| DELETE `/cart/items/:nftId/:editionId` | Remove uma linha, retorna Cart; repetição mantém ausência |
| PUT `/cart/coupon` | `{code}`; normaliza espaços/caixa. `KURIO10`: desconto de 10%. `EXPIRADO`: 422 `COUPON_EXPIRED`; demais: 422 `COUPON_INVALID`. Falha preserva cupom anterior |
| DELETE `/cart/coupon` | Remove cupom, retorna Cart |
| GET `/cart/quote` | Retorna Quote atual; sem reservar estoque ou criar pedido |
| POST `/cart/quote/validate` | `{id}`; retorna Quote se ainda válida; 409 `QUOTE_STALE` se ID mudou, expirou ou há linhas indisponíveis. Contrato preparado para checkout, sem executar compra |

`Nft.editions` contém `{id, label, available}[]`. A soma dos estoques das edições corresponde a `Nft.available`. Cada edição usa o preço atual do NFT; quantidade e estoque são específicos da edição. Fixtures repartem o estoque original entre `standard` (1/50), `limited` (1/10) e `unique` (1/1); edições esgotadas continuam selecionáveis para informar seu estado.

`Quote` contém `id`, `version`, `ownerId`, `cartVersion`, `expiresAt`, `coupon`, `valid`, `lines`, `subtotalEth`, `discountEth`, `networkFeeEth` e `totalEth`. Cada linha contém IDs, quantidade, snapshot do NFT/edição, `unitPriceEth`, `totalEth` e `issue: string|null`. Valores são strings decimais com até 18 casas. Cálculos usam inteiros `BigInt` em wei; desconto percentual trunca frações de wei, uma única vez sobre o subtotal. Taxa simulada: `0.016` ETH para carrinho não vazio, zero para vazio. Total = subtotal − desconto + taxa. Linhas sem estoque permanecem no carrinho e no resumo de referência, com `valid:false` e aviso; não representam compra permitida.

ID/versão são SHA-256 do proprietário, revisão do carrinho, versões/edições/quantidades dos NFTs, cupom, versão da política e janela de validade. Validade até o fim da janela UTC de cinco minutos (no máximo cinco minutos). Alterações de conteúdo ou expiração invalidam IDs anteriores. A UI renova no vencimento, a cada 30s, em foco e em eventos/reconexão; valores antigos ficam marcados como desatualizados durante renovação/falha. A futura criação de pedido deverá validar novamente e reservar estoque atomicamente.

Login/cadastro recebem também `X-Guest-Cart`: após validar credenciais, o MSW soma linhas por NFT/edição ao carrinho da conta, limita ao estoque atual com aviso e mantém linhas esgotadas visíveis para correção. O cupom da conta tem precedência; senão, herda o do visitante. A capacidade visitante é consumida uma única vez. Refresh/novo login não repetem o merge. O cliente gera outra capacidade após autenticar, sair ou expirar; o carrinho da conta permanece associado ao usuário.

`POST /api/__mock/cart/scenario` aceita `{failure?: 'none'|'network'|'server', delay?: number}` (0–9000ms; padrão none/150). Falhas ocorrem antes de alterar a fonte de dados; `server` retorna 503 e `network` simula falha de transporte. Cenário em sessionStorage sobrevive ao refresh; reset geral limpa carrinhos/cenários. UI: **Carrinho e cotação** oferece recuperação, falha, latência e timeout.

O controle `POST /api/__mock/nfts/:id/update` também aceita `{priceEth?, editionId?, available?}`. Preço precisa ser decimal não negativo com até 18 casas; disponibilidade inteira não negativa. Atualiza fonte compartilhada e versão antes de emitir Socket.IO, sem chamar setters React. Sem body, mantém a alternância de preço e reduz a primeira edição com estoque.

## Carteiras, checkout e pedidos · Etapa 4

Todas as rotas abaixo exigem Bearer válido; 401 sem sessão válida e 403 para acesso a recurso de outro usuário. O servidor determina o proprietário, sem aceitar userId do body. Sessão é revalidada após latência e imediatamente antes do commit do pedido.

`WalletInput = {label, address, networkId:'ethereum'|'polygon', kind:'primary'|'secondary'}`. Label 2–60, endereço `0x` + 40 hexadecimais ou ENS `.eth` até 120 caracteres. `Wallet` acrescenta `id`/`userId`. Uma principal nova transforma as anteriores do usuário em secundárias. Endereço+rede repetidos para a mesma conta retornam 409. Redes/provedores disponíveis vêm na resposta `Wallets`.

| Método / rota sob `/api` | Resultado |
| --- | --- |
| GET `/wallets` | `{userId,items:Wallet[],connection:WalletConnection|null,networks:[{id,label}],providers:WalletProvider[]}` |
| POST `/wallets` | WalletInput → Wallets; 422 validação/fields, 409 duplicata |
| POST `/wallets/connection` | `{walletId,provider}` → Wallets; provedores `WalletConnect`, `MetaMask`, `Coinbase Wallet`; 403 carteira alheia, 422 provedor inválido, 409 recusa simulada |
| DELETE `/wallets/connection` | Desconecta exclusivamente a sessão atual; retorna Wallets |
| POST `/orders` | Header `Idempotency-Key`; OrderInput → Order, 200 tanto na criação quanto recuperação idempotente |
| GET `/orders` | `{userId,items:Order[]}` do usuário atual |
| GET `/orders/:id` | Order ou 404/403 |
| GET `/orders/by-key/:key` | Recupera o pedido da tentativa do usuário; 404 se ainda não criado |

`Collector = {displayName,username,profileName,email,ens,referralCode,note}`. Os três nomes têm 2–60 caracteres; username aceita letras/números/ponto/hífen/sublinhado. E-mail válido até 254. ENS/indicação/observação são opcionais: ENS termina em `.eth`, indicação até 32 alfanuméricos/hífen/sublinhado, observação até 500. `OrderInput = {quoteId,walletId,networkId,collector}`.

`Order = {id,userId,idempotencyKey,createdAt,updatedAt,version,status,transactionId,quote,wallet,provider,collector,reason}`. `quote` e `wallet` são cópias imutáveis aceitas no commit. `status` é pending/confirmed/refused, versão inicial 1, resolução terminal 2. A referência de transação simulada só existe em confirmed. Recibos nunca consultam preços atuais para recalcular valores. Compra pode resolver após o vencimento da cotação original, pois a autorização/reserva ocorreu enquanto ela era válida.

Chave: 8–128 caracteres alfanuméricos, hífen ou sublinhado, sensível à caixa, com escopo por usuário. O fingerprint inclui os campos tipados normalizados, cotação, carteira e rede. Outra carga na mesma chave retorna 409 `IDEMPOTENCY_CONFLICT`, inclusive após recusa prévia de cotação; a UI usa nova chave após nova revisão. Mesmo payload recupera o mesmo pedido antes de revalidar a cotação, evitando conflito com a própria reserva. Sem chave válida: 422. Falhas de disponibilidade/cotação: 409 `STOCK_LIMIT`/`QUOTE_STALE`; falta de conexão/rede compatível: 409 `WALLET_DISCONNECTED`.

Criação reexecuta a cotação oficial, confere ID/validade/disponibilidade e a conexão carteira+rede da sessão. Dentro de um lock, debita estoque e persiste pedido pending em um único snapshot. Confirmação remove apenas quantidades compradas de linhas com `lineId` correspondente; linhas recriadas e acréscimos são preservados. Recusa libera a reserva uma única vez e conserva o carrinho. Efeitos não são reaplicados em replay/consulta/refresh. UI `/pagamento` e `/pedidos/:orderId` exige autenticação; pending/refused nunca renderizam recibo confirmado.

### Controles de checkout

`POST /api/__mock/checkout/scenario` aceita `{preset?}` ou campos parciais `{payment:'confirmed'|'refused'|'pending',settlementDelay:0..60000,timeoutAfterCreate,connectionRefused,disconnectPending,beforeCreate:'none'|'price'|'sold-out'|'expired'|'session-expired'}`. Padrão: confirmed após 1200ms; demais flags false/none. Presets: success/refused/pending/timeout/connection-refused/stale/price/sold-out/disconnect/session-expired. Persistem em sessionStorage. `stale` invalida a versão da cotação dentro da criação; vencimento real também é verificado e testado com relógio controlado.

`timeout` grava o pedido e perde a resposta após 9000ms, ultrapassando o timeout Axios de 8000ms; repetir a mesma chave recupera sem nova reserva. Essa espera ocorre fora do lock. `disconnect` interrompe o Socket.IO após criar pending. `pending` não agenda resolução automática. `price`/`sold-out` alteram a fonte e emitem nft.updated entre a revalidação inicial da UI e a validação do commit. `session-expired` revoga a sessão nesse ponto, sem reservar estoque.

`POST /api/__mock/orders/:id/resolve {status:'confirmed'|'refused'}` resolve pending; terminais são devolvidos intactos. `/api/__mock/checkout/resolve-pending` resolve todos os pendentes do cenário. `/api/__mock/orders/replay` reemite OrderUpdated somente para uma assinatura autorizada que corresponda ao userId/sessionId. Reset cancela timers e limpa todo o documento de comércio, tentativas/drafts locais, cenários e dados de autenticação pelas rotinas existentes.

## Evento `nft.updated`

Servidor simulado → `socket.io-client` pelo WebSocket Socket.IO:

```json
{
  "eventId": "emerald-ape-042:v2",
  "scope": "public",
  "resourceId": "emerald-ape-042",
  "version": 2,
  "resource": {
    "id": "emerald-ape-042",
    "name": "Emerald Ape #042",
    "image": "/assets/nfts/emerald-ape.png",
    "collection": "Kurio Apes",
    "creator": "Kurio Editions",
    "rarity": "raro",
    "priceEth": "1.49",
    "available": 7,
    "version": 2,
    "editions": [{"id":"standard","label":"1/50","available":5},{"id":"limited","label":"1/10","available":1},{"id":"unique","label":"1/1","available":1}],
    "description": "Um colecionável digital da coleção Kurio. Arte e identidade em um mundo digital sem fronteiras."
  }
}
```

`resourceId` e `version` devem coincidir com o snapshot. Versão menor ou igual à conhecida é ignorada. Cada alteração lógica aumenta a versão; duplicatas preservam evento/versão. Reconexão reconsulta REST. Eventos públicos não carregam identidade de usuário.

## Evento privado `order.updated`

`{eventId,scope:'private',userId,sessionId,resourceId,version,status:'pending'|'confirmed'|'refused'}`. `eventId = orderId:vN` é estável; sessionId corresponde ao destinatário autenticado. O cliente envia `session.subscribe {token,sessionId}` pelo Socket.IO; o MSW valida a sessão e responde `session.ready {userId,sessionId}`. `session.unsubscribe` remove a assinatura. O servidor valida novamente o token antes de enviar cada evento. Somente o usuário dono recebe o pedido.

O cliente valida identidade/versão e rejeita sessão anterior, duplicatas, versões antigas e qualquer regressão terminal. Eventos invalidam queries; os detalhes e o sucesso vêm de REST. Na reconexão, o cliente reassina e reconsulta; pending também usa polling de 1s e consulta manual. A UI não depende exclusivamente do evento e nunca produz confirmação diretamente do payload Socket.IO.

## Controles da simulação

Somente com mocks habilitados. O cliente de produção e hooks de catálogo não dependem destes endpoints.

| Método / rota sob `/api/__mock` | Comportamento |
| --- | --- |
| POST `/reset` | Restaura todos os NFTs v1 e cenário `success`; `{ok:true}`. Recarregar após o reset inicia cache/socket novos. |
| POST `/scenario` | Body `{scenario}`: `success`, `empty`, `error`, `slow`, `variable`, `offline`, `timeout`; inválido retorna 400. |
| POST `/nfts/:id/update` | Alterna preço 1.19/1.49 (outros preços vão para 1.49), reduz disponibilidade até zero e incrementa versão; persiste, emite `nft.updated` e retorna o evento; 404 para ID inexistente. |
| POST `/events/replay` | Reemite JSON fornecido sem modificar store. Serve a testes de duplicatas, versão antiga e identidade inválida. |
| POST `/disconnect` | Fecha conexões WebSocket interceptadas; o cliente reconecta e reconcilia com REST. |

Latência padrão: 120ms. `empty` afeta apenas a lista; `error` retorna 503 em lista/detalhe; `slow` demora 1800ms; `variable` usa 1200ms para busca de comprimento ímpar e 100ms para par; `offline` produz falha de rede; `timeout` demora 9000ms, além dos 8000ms de timeout Axios. Os controles permanecem disponíveis para recuperação. Cenário volta a `success` no refresh; alterações de NFT persistem até o reset.
