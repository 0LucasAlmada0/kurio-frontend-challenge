# Arquitetura · Etapas 1, 1.5 e 2

## Estrutura

```text
src/
  app/                 bootstrap de rotas, shell e QueryClient
  api/                 Axios e contratos de transporte
  features/catalog/    consultas, query keys, catálogo e detalhe
  features/auth/       sessão, ciclo de vida, validação e formulário compartilhado
  features/favorites/  queries privadas, mutations otimistas, botões e lista protegida
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

## Rede e tempo real

O bootstrap aguarda `worker.start()` antes de montar React. O código de mocks é carregado por import dinâmico quando habilitado. Axios não contém resposta fictícia. Fixtures e regras da simulação vivem apenas em `mocks/`.

REST e eventos leem/escrevem o mesmo `store` no contexto da página. O service worker intercepta o HTTP; os handlers executam na página. WebSockets são interceptados pelo MSW no contexto da página, sem servidor externo. `socket.io-client` usa o transporte **WebSocket**, protocolo Engine.IO 4/Socket.IO, namespace padrão. Não há polling HTTP nem fallback de transporte nesta prova.

A versão publicada `@mswjs/socket.io-binding@0.2.0` usa `toSocketIo(connection)` e difere do README da branch principal, que documenta uma API nova. MSW está fixado em 2.15.0: normaliza `/socket.io/` para `/` ao casar handlers, por isso `ws.link` usa a origem. O bootstrap importa a aplicação dinamicamente após `worker.start()`, pois Engine.IO captura a classe WebSocket na importação. O binding publicado realiza handshake e codifica eventos com os parsers Engine.IO/Socket.IO. O mock mantém as conexões para emitir com `io.client.emit` e envia ping Engine.IO a cada 10 segundos; timers e referências são liberados no fechamento. A interface apenas dispara um POST de controle; seu retorno nunca atualiza o cache. O listener do verdadeiro cliente Socket.IO valida a mensagem e sincroniza Query.

Validação de evento: escopo público, identificador estável não vazio, recurso/ID/versão correspondentes, versão inteira positiva, preço decimal e disponibilidade inteira não negativa. O maior número entre versões recebidas e cache impede reaplicação de duplicatas/eventos antigos. Antes de sincronizar, consultas antigas são canceladas via AbortSignal/Axios. O detalhe já consultado recebe o snapshot, e consultas são invalidadas para reconciliar listas, ordem e totais via REST. Eventos que chegam fora de ordem durante o cancelamento também são descartados. Na conexão/reconexão todas as consultas públicas ativas são revalidadas.

O teste de tempo real observa conexão, recibo acessível do listener, preço renderizado e igualdade entre REST e evento, testa duplicatas/versões antigas/identidade inválida, detalhe, reconexão com evento perdido e heartbeat além dos 30 segundos do handshake. Não chama setters nem APIs de Query.

## Cache, isolamento e persistência

Dados públicos usam `['public', 'nfts', ...]`, com parâmetros completos na chave das listas. Stale time 30s, coleta após 5min, revalidação ao foco e à reconexão. Uma tentativa adicional para falhas transitórias; erros HTTP 4xx não repetem. Mutations não repetem automaticamente. Requests obsoletos recebem AbortSignal. Nenhum cálculo monetário usa ponto flutuante: preços são strings e ordenação converte para wei com BigInt.

O catálogo simulado persiste em `localStorage` sob `kurio:mocks:v1`; cenário de rede e conexões ficam em memória. Reset integral restaura as fixtures e o cenário e, pela UI, recarrega a página. Cada teste tem contexto de navegador/armazenamento próprio e executa o reset via HTTP interceptado por MSW. O store permanece em memória se armazenamento estiver indisponível.

A Etapa 2 usa `['private', userId, sessionId, 'favorites']`. Dados públicos continuam nas chaves anteriores. `order.updated` permanece somente como contrato reservado: não há listeners privados nesta etapa. O socket público permanece conectado nas mudanças de conta; seus listeners não capturam identidade privada.

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

- Sem auditorias Lighthouse executadas, deploy ou integração com backend real. Configurações iniciais estão prontas; pontuações e metas finais ainda precisam ser medidas.
- A ferramenta Browser integrada falhou ao inicializar por erro de infraestrutura (`sandboxPolicy` ausente). Verificação executável e screenshots usam os testes Playwright do projeto.
- Mock apenas do namespace padrão e eventos JSON de texto. Rooms, namespaces privados, binários, acknowledgements e polling não foram implementados nem validados. Não é servidor Socket.IO de produção.
- Persistência do catálogo é consistente na página e no refresh; sincronização de alterações públicas entre abas não foi implementada. Sessão e favoritos são persistidos, com logout compartilhado validado em duas abas. Escritas simultâneas entre abas não têm transações de backend.
- A autenticação é simulação no navegador: storage e tokens são inspecionáveis pelo usuário local, sem cookie HttpOnly, backend seguro, recuperação de senha ou serviço social. PBKDF2 evita persistência de senha clara e não transforma o MSW em fronteira de segurança de produção. Storage indisponível limita persistência ao ciclo da página.
- Expiração remota é detectada por REST/foco e pelo timer local; não há push privado ou listeners de pedidos. Encerrar a página durante um cadastro pode deixar uma conta criada na simulação, mesmo se a resposta não chegou ao cliente; novo cadastro retorna conflito e permite login.
- Carrinho, cotações, checkout, pedidos idempotentes, perfil, carteiras e respectivos cenários permanecem para etapas autorizadas posteriores.
- Filtros combinados e controles mais completos, regressões visuais das telas futuras, metadados específicos de cada rota e auditoria de acessibilidade final permanecem pendentes.
- Captura desktop de início isolada ausente; acesso pelo conector Figma negado. Cores, família tipográfica e fidelidade final dependem de inspeção posterior.
- Dependências transitivas do LHCI incluem pacotes com avisos de depreciação na instalação. Não se tentou substituir a stack de auditoria exigida nesta etapa.

Próxima etapa depende de autorização. Carrinho, checkout e pedidos não foram implementados. Não foram criados commits automaticamente.
