# Arquitetura · Etapas 1 a 6

## Estrutura

```text
src/
  app/                 bootstrap de rotas, shell e QueryClient
  api/                 Axios e contratos de transporte
  features/catalog/    consultas, query keys, catálogo e detalhe
  features/auth/       sessão, ciclo de vida, validação e formulário compartilhado
  features/favorites/  queries privadas, mutations otimistas, botões e lista protegida
  features/cart/       identidade visitante, consultas/mutations, seleção e carrinho
  features/checkout/   carteira compartilhável, revisão, tentativa persistida e recibo
  features/profile/    layout de conta, formulário/avatar/senha e gestão de carteiras
  components/          card, loading, erro e primitives shadcn/ui
  realtime/            socket.io-client, validação e ciclo de vida
  mocks/               fixtures, armazenamento, rede e controles
  lib/                 composição de classes e precisão ETH
  main.tsx             inicialização assíncrona do MSW
  styles.css           tokens provisórios e composição responsiva
tests/e2e/             testes e baselines do Playwright
public/assets/nfts/    quatro imagens originais copiadas
```

## Origem das decisões

O README oficial exige React/TypeScript, Router, Query, Axios/REST, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright e Lighthouse. O candidato limitou a entrega à Etapa 1, escolheu Vite e strict, forneceu capturas e quatro imagens e solicitou tokens provisórios, controles reproduzíveis e documentação.

Decisões do agente: rotas declaradas em código, sem gerador; Tailwind v4; primitives shadcn/ui locais com Slot/CVA; catálogo paginado em 8 itens com 12 fixtures derivadas das quatro imagens; persistência local versionada; eventos com snapshot completo; invalidação de listas após evento em vez de tentar recalcular ordenação/paginação no cliente. Nenhum serviço privado, backend separado, nova imagem ou fonte externa foi usado.

## Catálogo e filtros · Etapa 6

`features/catalog/search.ts` normaliza os parâmetros compartilhados pelo Router, query keys e MSW. Preços são strings validadas/canonicalizadas por wei/BigInt; `app/search.ts` preserva os decimais brutos antes do parser JSON padrão, sem convertê-los a Number. Defaults são omitidos com o middleware do TanStack Router. Navegações parciais leem o estado anterior para preservar filtros em alterações rápidas; filtros/busca/sort reiniciam a página e paginação preserva o conjunto. Ícone de busca do header e fundo da autenticação também mantêm o contexto completo.

GET `/nfts/filters` deriva opções dos NFTs existentes; listas GET `/nfts` combinam grupos e intervalos na rede, contam e só depois ordenam/paginam. Não há nova fixture, categoria ou rede inventada. Seleções no mesmo grupo usam OR; grupos diferentes usam AND. Desempate por ID é crescente mesmo em preço decrescente. Páginas que ficam vazias após alteração de estoque/URL recebem recuperação explícita para a primeira página, sem navegação automática em loop.

Sidebar e drawer reutilizam `FilterGroup`/`FilterOption`, formulário de preço e componentes existentes. As duas apresentações recebem o mesmo estado da URL e os mesmos metadados, consultados uma vez pela página; IDs de campos/radios são distintos por instância. No mobile o dialog nativo abre sobre o viewport, bloqueia scroll de fundo, trata Escape, mantém Tab/Shift+Tab dentro do painel e restaura foco no botão de abertura. Seleções e rascunho de preço permanecem ao fechar/reabrir; Aplicar confirma os preços e Ver resultados fecha o painel. Os inputs substituem o slider ilustrativo para permitir valores exatos de até 18 casas. A regra visual de sidebar/grid/hero permanece; foram ativados os controles e exibido o contador também no mobile.

Consultas consomem AbortSignal; mudanças de chave apresentam skeleton em vez de exibir resultados/contadores do filtro anterior. Revalidação da mesma chave preserva os cards e anuncia atualização em segundo plano. Metadados/erros têm recuperação própria; lista trata HTTP/offline/retry. O provedor Socket.IO existente invalida/reconcilia com REST e continua descartando duplicatas/versões antigas. Chaves privadas, autenticação, carrinho, checkout e perfil não foram substituídos.

Diferenças visuais intencionais: coleções/raridades/disponibilidade reais no lugar de categorias/redes ilustrativas sem dados, inputs de preço precisos e contador mobile. Cinco baselines foram comparadas antes de atualizar: catálogo em três larguras e fundo da sidebar no login/autofill desktop/tablet. Detalhe, cadastro, carrinho, pagamento, recibo e login mobile conservaram suas baselines. Fonte/cores provisórias, dados/ordem ilustrativos e ausência do frame desktop isolado permanecem para o polimento autorizado posteriormente.

## Perfil e carteiras · Etapa 5B

Perfil reutiliza `kurio:mock-auth:v1` com campo opcional por usuário; contas anteriores recebem defaults na leitura, sem reset. Edição contém versão e só persiste após validar todos os campos, senha atual, confirmação e avatar. Um único commit salva dados/salt/hash e atualiza nome/e-mail das sessões desse usuário. Falha mantém tudo anterior. `auth.updateUser` publica os dados novos mantendo token/ID/timer/cache; `restore` também atualiza dados de uma sessão já conhecida. Queries e mutations mantêm chaves por usuário/sessão, cancelamento e guarda de identidade. Senhas não vão para storage/logs/respostas e são removidas das variáveis da mutation após o envio.

Avatar é uma imagem local PNG/JPEG/WebP de até 512 KiB, validada no cliente e MSW. Data URL foi escolhida para manter a simulação persistente sem serviço privado/dependência; leitura/preview/remover são edições pendentes, confirmadas pelo mesmo Salvar do frame. Storage cheio/indisponível recusa a gravação em vez de declarar sucesso. Apelido público/ENS do perfil são metadados opcionais; não alteram carteiras cadastradas. A senha permanece opcional na edição normal; preencher um dos campos exige o conjunto completo.

`WalletForm`, `useWallets`, `validateWallet` e a fonte de carteiras do checkout agora suportam edição e os metadados opcionais do frame. Não há segunda fonte/regra de carteira. PUT mantém identidade/autorizações; promoção reclassifica a anterior dentro do mesmo commit. Alterar endereço/rede invalida conexões existentes; pedidos guardam cópias imutáveis e não são reescritos. A resposta atualiza o cache compartilhado pelo checkout. Sem Web Locks o fallback continua limitado à página; com ele, escritas de perfil, sessão, favoritos e comércio usam a mesma serialização, inclusive durante operações assíncronas.

`AccountLayout` reproduz a sidebar desktop; perfil e carteira usam colunas do frame, com campos empilhados no tablet e navegação de conta compacta no mobile. Inputs/Button/Skeleton/ícones e tokens existentes foram reutilizados. Ações fora do escopo permanecem desativadas. Não há avatar estático original; o placeholder usa o ícone local existente e a imagem escolhida pelo usuário ocupa 50×50px com recorte circular. ENS/indicação e metadados opcionais são identificados; não se exige uma identidade blockchain fictícia para salvar a conta. Dados preenchidos, carteira secundária da fixture, mensagens de validação e controles de demonstração explicam diferenças em relação ao frame vazio. Fontes/cores provisórias permanecem. Capturas reais são anexadas aos testes em 390/768/1440px; baselines anteriores não foram regeneradas.

## Publicação · Etapa 5A

Hospedagem estática na raiz da origem, com `vercel.json` fixando `npm ci`, `npm run build:demo`, preset Vite e `dist`. Rewrites preservam arquivos existentes e excluem API/assets/socket/worker do fallback SPA. O header do worker exige revalidação; seu escopo é a raiz. Não houve alteração do bootstrap: MSW continua iniciando antes de React e Socket.IO. Sem `VITE_SOCKET_URL`, ambos os lados da simulação usam a origem publicada e o protocolo seguro em HTTPS; não há processo WebSocket hospedado na Vercel. Variáveis Vite são públicas e exigem rebuild.

Playwright aceita `E2E_BASE_URL` para usar a URL publicada sem iniciar um servidor local; `E2E_PREVIEW=true` mantém a opção de testar o artefato via Vite. `deploy.spec.ts` verifica fallback por HTTP fora do service worker, MIME/arquivos públicos e inicialização em acesso direto, sem storage anterior, seguida de evento Socket.IO e refresh. O preview não valida regras/headers executados na CDN; essa confirmação depende de URL pública. O usuário confirmou publicação validada após a Etapa 5A. Novas publicações e verificações externas seguem o roteiro manual do README; a Etapa 5B não realizou deploy.

## Checkout e consistência · Etapa 4

`commerce-db.ts` migra as chaves anteriores de catálogo/carrinhos sem apagar contas/favoritos. Um documento `kurio:mock-commerce:v1` contém NFTs, carrinhos, carteiras, conexões por sessão, pedidos, fingerprints de idempotência e versão de invalidação de cotação. Escritas de comércio passam por `commerceTransaction`: Web Locks serializa inclusive documentos da mesma origem; fallback é uma fila da página. Leitura/validação final e escrita ficam no mesmo lock, inclusive durante SHA-256 assíncrono. Cada commit financeiro grava reserva+pedido, ou estado terminal+estoque/carrinho, em um único `localStorage.setItem`. Não existe intervalo com estoque reservado sem pedido persistido.

Idempotência tem escopo de usuário. O payload normalizado inclui cotação, carteira, rede e todos os dados do colecionador. Uma chave válida fica vinculada a esse conteúdo, mesmo se a cotação for recusada; outro conteúdo retorna conflito. Pedido existente com a mesma chave/payload é devolvido antes de revalidar a cotação: sua própria reserva pode ter alterado disponibilidade/versões, mas isso não representa outra compra. A UI guarda a tentativa antes do POST, cancela requests privados na mudança de sessão e permite consulta/reenvio após resposta perdida. Uma recusa terminal só vira nova tentativa por ação explícita, com chave nova.

Criação revalida toda a cotação e sua validade, sessão, carteira/usuário, conexão da sessão e rede. O snapshot original é copiado para o pedido antes de debitar estoque disponível. Pendentes reservam as quantidades; confirmação conserva esse débito, recusa o devolve. Timers usam prazo/resultado persistidos, recuperados por REST após refresh; não são um backend em segundo plano quando a página está fechada. Estados confirmed/refused nunca mudam. Efeitos de resolução só são aplicados na transição de pending.

Linhas de carrinho recebem `lineId`. Na confirmação, somente linhas com a identidade capturada são reduzidas pelas quantidades compradas; acréscimos e outros NFTs continuam. Remover/recriar o mesmo SKU gera outra identidade e preserva a nova linha. Linhas legadas recebem identidade ao criar o pedido. Cupom e demais modificações atuais do carrinho são preservados.

Carteiras e provedores vêm de REST; fixtures ficam nos mocks. `WalletPanel`/`WalletForm` estão preparados para a futura página dedicada, sem criá-la nesta etapa. Adicionar uma principal reclassifica a anterior como secundária no mesmo commit. Conexões simuladas pertencem à sessão; não há extensão EIP-1193 nem resolução ENS real. A política de taxa da cotação anterior é reutilizada, sem cálculo financeiro na UI.

O socket público é preservado. Um listener privado por sessão envia `session.subscribe`; o MSW autentica o token e valida user/session antes de emitir `order.updated`. Logout/troca remove listener e assinatura; o servidor também recusa token revogado/expirado. Eventos têm versão monotônica e identidade estável; duplicatas, eventos antigos, outra sessão e regressão terminal são descartados. O evento invalida consultas e o recibo só aparece depois de REST retornar confirmed. Reconexão invalida pedidos ativos; polling de pendentes e consulta manual recuperam eventos perdidos. Cache usa `['private', userId, sessionId, 'orders'|'wallets', ...]` e mantém proteção de identidade/AbortSignal existente. Respostas atrasadas da mutation não substituem estado terminal já conhecido.

Layout: formulário à esquerda e itens/valores/carteiras/ação à direita no desktop; mobile prioriza os cards de carteira/provedor e empilha dados/revisão obrigatórios, ausentes do frame mobile. Recibo centralizado segue a referência desktop, com meta em duas colunas no mobile. Campos de indicação/ENS são opcionais para não impedir colecionadores sem esses dados; sua sintaxe continua validada quando preenchidos. O ícone de envelope reutiliza o sistema SVG existente porque o asset “THANK YOU” não foi fornecido. Fonte/cores provisórias e footer reduzido permanecem; não há seções editoriais ou exploração fictícia de blockchain.

## Carrinho e cotação

`mocks/cart-store.ts` é a fonte compartilhada de carrinhos, merge, estoque e cotação; `cart-handlers.ts` aplica autorização, latência e falhas. Na Etapa 3, os armazenamentos eram `kurio:mock-carts:v1` e `kurio:mocks:v2`; a Etapa 4 os migra para o documento de comércio descrito acima. Usuários/favoritos permanecem no armazenamento existente.

Componentes recebem dados REST e enviam intenções; não calculam subtotal, desconto ou total. `PurchaseControls` compartilha seleção entre cards/detalhe. `useCart` usa Axios/TanStack Query e mutations pessimistas: mantém os itens anteriores em falhas e serializa alterações por identidade, com bloqueio compartilhado entre componentes. O servidor é responsável pelos limites de estoque. As chaves são `['private', userId, sessionId, 'cart', ...]` e `['visitor', guestId, 'cart', ...]`; quote acrescenta revisão do carrinho. Placeholder de cotação só pode reutilizar dados do mesmo proprietário.

Sessão anterior é cancelada/limpa como nos favoritos; carrinhos visitantes também são cancelados/limpos na transição. Requisições verificam identidade antes/depois, combinam AbortSignals e capturam credencial de origem. O MSW reautoriza após a latência e rejeita capacidades visitantes consumidas pelo merge. Troca de conta nunca transforma um carrinho privado em visitante. Carrinhos persistidos da conta só voltam com autenticação dessa conta.

Eventos aceitos pelo provedor Socket.IO invalidam carrinho/cotação e catálogo; reconexão também reconsulta REST. Versões/duplicatas continuam filtradas pelo pipeline público existente. Cotação tem fingerprint/validade e validação REST; BigInt/wei garante precisão financeira. Consultar/alterar carrinho não reserva estoque; a criação do pedido na Etapa 4 faz a reserva. Persistência permanece simulada no navegador; Web Locks protege comércio entre abas suportadas, mas produção precisa de transações e segurança em um backend real, inclusive entre dispositivos.

Correção de autofill: campos transparentes deixavam aparecer o preenchimento interno de autofill do Chromium (regras UA com `!important`). A regra localizada `:autofill`/`:-webkit-autofill` pinta um inset com o token de fundo da apresentação e preserva texto/caret, sem desativar autocomplete. Referência: [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:autofill). Playwright força a pseudo-classe pelo CDP para verificar o estado e capturar a aparência; não armazena senhas reais no navegador.

## Rede e tempo real

O bootstrap aguarda `worker.start()` antes de montar React. O código de mocks é carregado por import dinâmico quando habilitado. Axios não contém resposta fictícia. Fixtures e regras da simulação vivem apenas em `mocks/`.

REST e eventos leem/escrevem o mesmo `store` no contexto da página. O service worker intercepta o HTTP; os handlers executam na página. WebSockets são interceptados pelo MSW no contexto da página, sem servidor externo. `socket.io-client` usa o transporte **WebSocket**, protocolo Engine.IO 4/Socket.IO, namespace padrão. Não há polling HTTP nem fallback de transporte nesta prova.

A versão publicada `@mswjs/socket.io-binding@0.2.0` usa `toSocketIo(connection)` e difere do README da branch principal, que documenta uma API nova. MSW está fixado em 2.15.0: normaliza `/socket.io/` para `/` ao casar handlers, por isso `ws.link` usa a origem. O bootstrap importa a aplicação dinamicamente após `worker.start()`, pois Engine.IO captura a classe WebSocket na importação. O binding publicado realiza handshake e codifica eventos com os parsers Engine.IO/Socket.IO. O mock mantém as conexões para emitir com `io.client.emit` e envia ping Engine.IO a cada 10 segundos; timers e referências são liberados no fechamento. A interface apenas dispara um POST de controle; seu retorno nunca atualiza o cache. O listener do verdadeiro cliente Socket.IO valida a mensagem e sincroniza Query.

Validação de evento: escopo público, identificador estável não vazio, recurso/ID/versão correspondentes, versão inteira positiva, preço decimal e disponibilidade inteira não negativa. O maior número entre versões recebidas e cache impede reaplicação de duplicatas/eventos antigos. Antes de sincronizar, consultas antigas são canceladas via AbortSignal/Axios. O detalhe já consultado recebe o snapshot, e consultas são invalidadas para reconciliar listas, ordem e totais via REST. Eventos que chegam fora de ordem durante o cancelamento também são descartados. Na conexão/reconexão todas as consultas públicas ativas são revalidadas.

O teste de tempo real observa conexão, recibo acessível do listener, preço renderizado e igualdade entre REST e evento, testa duplicatas/versões antigas/identidade inválida, detalhe, reconexão com evento perdido e heartbeat além dos 30 segundos do handshake. Não chama setters nem APIs de Query.

## Cache, isolamento e persistência

Dados públicos usam `['public', 'nfts', ...]`, com parâmetros completos na chave das listas. Stale time 30s, coleta após 5min, revalidação ao foco e à reconexão. Uma tentativa adicional para falhas transitórias; erros HTTP 4xx não repetem. Mutations não repetem automaticamente. Requests obsoletos recebem AbortSignal. Nenhum cálculo monetário usa ponto flutuante: preços são strings e ordenação converte para wei com BigInt.

Catálogo e comércio persistem no documento `kurio:mock-commerce:v1`; as chaves anteriores são apenas origem de migração. Cenários de autenticação/carrinho/checkout usam sessionStorage; sockets/timers ficam na página. Reset integral restaura fixtures e cenários e, pela UI, recarrega a página. Cada teste tem contexto de navegador/armazenamento próprio e executa reset via HTTP MSW. Storage indisponível limita persistência ao ciclo da página.

A Etapa 2 usa `['private', userId, sessionId, 'favorites']`. Dados públicos continuam nas chaves anteriores. A Etapa 4 implementa o contrato antes reservado de `order.updated`, com assinatura por sessão. O socket público permanece conectado nas mudanças de conta.

## Sessão e isolamento · Etapa 2

`features/auth/session.ts` coordena a identidade recuperada por REST, token opaco persistido e um AbortController por ciclo de sessão. O React assina o estado com `useSyncExternalStore`; não contém fixtures ou respostas alternativas. Uma geração invalida recuperações/logins antigos. Logout, troca e expiração abortam as operações privadas, cancelam/removem queries privadas, removem suas mutations do cache e liberam o timer anterior. Requisições privadas capturam a sessão e verificam sua identidade antes e depois do Axios. Callbacks de mutations também verificam a sessão antes de alterar cache/feedback. Um token de A nunca é substituído silenciosamente pelo token de B em uma requisição em andamento.

O token é recuperado no início; GET `/session` confirma usuário/validade. Timer local e respostas REST 401 encerram a sessão; foco revalida com a API. A rota `/favoritos` usa `beforeLoad` do Router e é invalidada nas transições. Login mantém o destino interno na URL, preservando busca/hash e recusando redirecionamento externo. Eventos `storage` sincronizam entrada/saída entre abas e são liberados ao desmontar o lifecycle. O store MSW relê o armazenamento na autorização, inclusive depois da espera simulada.

Favoritos usam mutations TanStack Query com PUT/DELETE idempotentes, atualização otimista da associação do NFT e rollback apenas desse ID. Rollback de um item não substitui a lista inteira nem apaga mudanças de outros itens. Um bloqueio síncrono por sessão/NFT e `useIsMutating` impedem duplicatas entre botões. A lista só é revalidada quando as mutations locais dessa sessão terminam. Feedback da lista observa o cache de mutations da sessão, mantendo o erro visível mesmo se a remoção otimista desmontar o card. Nenhuma resposta de sessão anterior pode aplicar rollback ou recriar dados privados.

MSW guarda usuários, salts/hashes, sessões revogáveis e favoritos por usuário em `kurio:mock-auth:v1`. A autorização aplica 401/403 na rede; a sessão é revalidada antes da leitura/escrita final para recusar operações que ficaram pendentes após logout. Há dois usuários determinísticos. [Web Crypto deriveBits](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits) fornece PBKDF2/SHA-256, 600.000 iterações e 256 bits; cadastros recebem salt aleatório. Nenhuma senha é persistida em texto claro.

O formulário único usa `<dialog>` nativo para foco modal/Escape, com apresentação sobre o catálogo/detalhe no desktop e tela inteira no mobile. Componentes públicos aceitam parâmetros de apresentação para mostrar o contexto de retorno atrás do modal, mantendo os mesmos hooks/contratos. Inputs têm labels, erros associados e estado pendente. Google/Facebook e recuperação de senha permanecem desativados. A lista de favoritos reutiliza NFTCard e consultas públicas por ID; não implementa perfil ou outros fluxos privados.

## Interface e acessibilidade

Tokens centrais: fundo `#160e0b`, painel `#2a1912`, primário `#d68d49`, texto `#f2ece3`, secundário `#c1a783`; raios e unidade de espaçamento também são variáveis. Valores inferidos das capturas, substituíveis depois. `font/family` não foi tratado como nome real: `--font-kurio` usa fallback monoespaçado.

Na Etapa 1.5, o header desktop recebe Início/Mercado e espaços inativos para Criadores/Aprenda, carrinho e autenticação. O ícone de busca abre a busca existente via hash `#search`, preservando parâmetros. No mobile a busca é sempre visível. Hero desktop sem painel, imagem única ampliada; hero mobile com duas imagens sobrepostas, formas decorativas e indicadores sem interação. Sidebar com grupos de filtros desativados, três colunas no desktop, duas no tablet/mobile e deslocamento alternado de 30px no mobile. As abas futuras ficam desativadas; busca, ordenação e paginação mantêm a lógica existente.

O detalhe ganha galeria com uma imagem real e espaços indisponíveis para outras vistas, informações da API, edições/quantidade/compra/favoritos desativados e área inferior de informações. No mobile o painel sobrepõe a imagem e agrupa quantidade/preço/ações na parte inferior, substituindo a navegação global nessa rota. Itens relacionados reutilizam `catalogOptions` filtrando a coleção e excluindo o NFT atual, sem fixtures na interface. As mesmas invalidações públicas atualizam também essa consulta.

Componentes novos: `Icon` (SVGs locais, sem dependência), `FilterGroup`/`FilterOption` (aceitam estado e handlers para integração futura), `NftGallery` e `RelatedNfts`. Não houve mudança em contratos, endpoints, fixtures, preços, query keys, persistência ou Socket.IO. Imagens mantêm proporções quadradas e arquivos originais. Os testes existentes foram adaptados à busca pelo ícone e ao escopo do preço no detalhe; continuam verificando o transporte e passam a verificar ações desativadas e overflow no detalhe. Baselines cobrem início e detalhe em 390/768/1440px.

### Comparação visual e diferenças remanescentes

- Desktop/Início foi comparado à parte visível de `desktop/login-modal.png`: header, hero aberto, sidebar e três colunas. O frame isolado está ausente; a região encoberta pelo modal não permite aferição completa.
- Mobile/Início segue `mobile/inicio.png`: margens próximas de 22px a 390px, busca de 42px, hero de aproximadamente 180px, cards em duas colunas escalonadas e navegação de cinco posições com scanner central elevado. Ordenação/paginação e disponibilidade permanecem visíveis por serem recursos reais da Etapa 1.
- Desktop/Detalhe segue `desktop/detalhe-nft.png`: miniaturas laterais, imagem principal, informações e ações à direita, detalhes e coleção abaixo. A 768px as miniaturas passam para baixo da imagem para manter legibilidade.
- Mobile/Detalhe segue `mobile/detalhe-nft.png`: controles superiores, imagem grande, painel arredondado sobreposto e bloco inferior de preço/ações. Conteúdo real adicional, itens relacionados e controles de demonstração aumentam a altura total. O bloco de ações acompanha o fluxo e não cobre dados.
- A fonte real permanece desconhecida. O fallback foi ajustado para Consolas/Liberation Mono, de aparência menos serifada. Cores existentes foram preservadas e os gradientes/realces também passaram a tokens substituíveis.
- A ordenação por nome agrupa edições do mesmo personagem; títulos, preços, disponibilidade e contagens diferem das capturas porque a API continua sendo a fonte de verdade. Não se copiou a ordem ilustrativa do Figma para a UI.
- Há somente quatro imagens originais, uma vista por personagem. Não foram inventadas vistas extras, avaliações, contagens de filtros, contrato de blockchain ou atributos ausentes da API. Os respectivos espaços são desativados ou usam informação disponível. O footer permanece reduzido ao escopo existente; sem seções editoriais ou formulários sem implementação.

As seis capturas revisadas estão em `tests/e2e/foundation.spec.ts-snapshots/`, nomes `catalog-{mobile,tablet,desktop}-win32.png` e `detail-{mobile,tablet,desktop}-win32.png`. Nenhum commit foi criado nesta etapa.

## Limitações e pendências

- Sem auditorias Lighthouse executadas ou integração com backend real. O usuário informou deploy público validado com seis testes após a Etapa 5A; a Etapa 5B é validada localmente e precisa de nova publicação para atualizar esse ambiente.
- A ferramenta Browser integrada falhou ao inicializar por erro de infraestrutura (`sandboxPolicy` ausente). Verificação executável e screenshots usam os testes Playwright do projeto.
- Mock apenas do namespace padrão e eventos JSON de texto. Rooms, namespaces privados, binários, acknowledgements e polling não foram implementados nem validados. Não é servidor Socket.IO de produção.
- REST lê o snapshot compartilhado, mas broadcasts Socket.IO entre páginas distintas não foram implementados. Sessão/favoritos têm logout compartilhado; escritas de conta/comércio usam Web Locks quando disponível. Não há transação distribuída entre dispositivos nem backend real.
- A autenticação é simulação no navegador: storage e tokens são inspecionáveis pelo usuário local, sem cookie HttpOnly, backend seguro, recuperação de senha ou serviço social. PBKDF2 evita persistência de senha clara e não transforma o MSW em fronteira de segurança de produção. Storage indisponível limita persistência ao ciclo da página.
- Expiração remota é detectada por REST/foco e timer local, sem evento específico de expiração. Pedidos têm evento privado e recuperação REST. Encerrar a página durante cadastro pode deixar a conta criada, mesmo sem a resposta; novo cadastro retorna conflito e permite login.
- Perfil e gestão dedicada de carteiras foram implementados na Etapa 5B; checkout e snapshots anteriores permanecem preservados. Senhas alteradas não encerram outros tokens válidos; eles mantêm sua expiração original na simulação.
- Catálogo/filtros combinados estão implementados na Etapa 6; metadados específicos de cada rota, Lighthouse e polimento/auditoria final permanecem para etapas autorizadas posteriormente.
- Captura desktop de início isolada ausente; acesso pelo conector Figma negado. Cores, família tipográfica e fidelidade final dependem de inspeção posterior.
- Dependências transitivas do LHCI incluem pacotes com avisos de depreciação na instalação. Não se tentou substituir a stack de auditoria exigida nesta etapa.

Próxima etapa depende de autorização. Não foram criados commits automaticamente. Blockchain, extensões e gateways reais não fazem parte da simulação.
