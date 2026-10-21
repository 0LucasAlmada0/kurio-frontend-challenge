# Contratos iniciais

Tipos executáveis: `src/api/contracts.ts`. JSON UTF-8. Os endpoints da simulação são interceptados por MSW e não requerem servidor. `/api` é o prefixo padrão.

## NFT

`Nft`: `id`, `name`, `image` (caminho local), `collection`, `creator`, `rarity` (`comum|raro|lendário`), `priceEth` (string decimal de até 18 casas), `available` (inteiro >= 0), `version` (inteiro monotônico > 0), `description`.

Preço nunca deve ser convertido a Number para cálculo. Ordenação usa wei/BigInt. Nenhum checkout ou cálculo de taxas faz parte desta etapa.

| Método / rota | Entrada | Saída |
| --- | --- | --- |
| GET `/api/nfts` | `q` string, `page` inteiro >=1, `sort=name|price-asc|price-desc` | `{ items: Nft[], total, page, pageSize: 8 }` |
| GET `/api/nfts/:id` | Identificador estável | `Nft` ou 404 |

Busca ignora maiúsculas e consulta nome/coleção; sort é estável por ID no empate de preços. Página além da última retorna lista vazia mantendo `total`. Router normaliza busca inválida para string vazia, página 1 e ordenação `name`; a UI limita busca a 120 caracteres. Mudança de busca/ordenação reinicia página. AbortSignal cancela chamadas obsoletas.

Erros: `{ code: string, message: string }`. `NOT_FOUND` (404), `UNAVAILABLE` (503). Rede indisponível/timeout geram erros de transporte, sem JSON de sucesso. Demais recursos privados, validação, conflitos e idempotência serão especificados quando implementados.

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
    "description": "Um colecionável digital da coleção Kurio. Arte e identidade em um mundo digital sem fronteiras."
  }
}
```

`resourceId` e `version` devem coincidir com o snapshot. Versão menor ou igual à conhecida é ignorada. Cada alteração lógica aumenta a versão; duplicatas preservam evento/versão. Reconexão reconsulta REST. Eventos públicos não carregam identidade de usuário.

## Contrato reservado `order.updated`

`{ eventId, scope: 'private', userId, sessionId, resourceId, version, status: 'pending'|'confirmed'|'refused' }`. Apenas tipado; não é emitido, assinado nem aplicado. A etapa de pedidos deverá validar a sessão atual, estados terminais e idempotência, além de recuperar o recurso por REST.

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
