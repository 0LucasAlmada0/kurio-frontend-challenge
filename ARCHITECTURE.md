# Arquitetura · Etapa 1

## Estrutura

```text
src/
  app/                 bootstrap de rotas, shell e QueryClient
  api/                 Axios e contratos de transporte
  features/catalog/    consultas, query keys, catálogo e detalhe
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

Fronteira futura privada: `privateKeys.user(userId)` separada das chaves públicas. Nenhum dado privado é carregado hoje. `order.updated` já tem contrato com userId/sessionId e não é assinado/aplicado nesta etapa. A implementação futura deverá ter conexão/subscriptions vinculadas à sessão, validar userId/sessionId antes de ler ou escrever cache e cancelar/remover queries privadas no logout/troca/expiração. A limpeza do provider público já libera listeners e desconecta o socket ao desmontar. Isolamento autenticado não é declarado pronto.

## Interface e acessibilidade

Tokens centrais: fundo `#160e0b`, painel `#2a1912`, primário `#d68d49`, texto `#f2ece3`, secundário `#c1a783`; raios e unidade de espaçamento também são variáveis. Valores inferidos das capturas, substituíveis depois. `font/family` não foi tratado como nome real: `--font-kurio` usa fallback monoespaçado.

Header, hero reduzido, sidebar e grid no desktop; grid em duas colunas e navegação inferior própria no mobile. Não são reproduções completas das nove telas. Busca/ordenação funcionam; não há abas, favoritos, carrinho ou botões de compra fictícios. Imagens mantêm proporções quadradas e arquivos originais. Sem screenshots completos no bundle. Estados usam labels, foco visível, skip link, announcements e skeletons com dimensões reservadas; reduced motion remove animações. Baselines iniciais cobrem catálogo e detalhe nos três viewports.

## Limitações e pendências

- Sem auditorias Lighthouse executadas, deploy ou integração com backend real. Configurações iniciais estão prontas; pontuações e metas finais ainda precisam ser medidas.
- A ferramenta Browser integrada falhou ao inicializar por erro de infraestrutura (`sandboxPolicy` ausente). Verificação executável e screenshots usam os testes Playwright do projeto.
- Mock apenas do namespace padrão e eventos JSON de texto. Rooms, namespaces privados, binários, acknowledgements e polling não foram implementados nem validados. Não é servidor Socket.IO de produção.
- Persistência do catálogo é consistente na página e no refresh; sincronização de múltiplas abas não foi implementada. Não há persistência de sessão ou dados privados.
- Auth, fixtures de dois usuários, favoritos/otimismo com rollback, carrinho, cotações, checkout, pedidos idempotentes, perfil, carteiras e respectivos cenários permanecem para etapas autorizadas posteriores.
- Filtros combinados e controles mais completos, regressões visuais das telas futuras, metadados específicos de cada rota e auditoria de acessibilidade final permanecem pendentes.
- Captura desktop de início isolada ausente; acesso pelo conector Figma negado. Cores, família tipográfica e fidelidade final dependem de inspeção posterior.
- Dependências transitivas do LHCI incluem pacotes com avisos de depreciação na instalação. Não se tentou substituir a stack de auditoria exigida nesta etapa.

Próxima etapa sugerida: autenticação simulada e fronteira de sessão com dois usuários, favoritos com rollback, expansão controlada dos filtros e revisão dos tokens no Figma. Carrinho/checkout dependem de autorização posterior.
