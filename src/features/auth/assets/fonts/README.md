# Roboto Mono · arquivos locais

Fonte: [Fontsource Roboto Mono](https://fontsource.org/fonts/roboto-mono), pacote público `@fontsource/roboto-mono@5.3.0`. Apenas Latin normal 400/700 WOFF2, sem conversão ou alterações nos binários. A licença OFL-1.1 original acompanha os arquivos em `LICENSE`.

Origem reproduzível: https://registry.npmjs.org/@fontsource/roboto-mono/-/roboto-mono-5.3.0.tgz

Integridade SHA-512 do pacote (base64): `yhwplHMHW9dCk+1pZuERfcJe+K3rosGVZEoK0XktkxRSqQ9qsipSwwiuW2/8Qmtp9lzu3Ixa/ie4BMH3i8CkZQ==`.

Extraia somente `package/files/roboto-mono-latin-400-normal.woff2`, `package/files/roboto-mono-latin-700-normal.woff2` e `package/LICENSE` após conferir a integridade. Não é necessário instalar o pacote nem ferramentas de conversão.

| Arquivo | Bytes | SHA-256 |
| --- | --- | --- |
| roboto-mono-latin-400-normal.woff2 | 12680 | e03013e0baa5690a803c188da2214d920c3245b25ad78421ecc8ae86cd842ae9 |
| roboto-mono-latin-700-normal.woff2 | 12696 | 283fbef73f42c21722c5a3efc7a44b0c38aac1ada665602b2144c13ed58c0e99 |

As declarações em `src/styles.css` usam `font-display: swap`. A família é compartilhada pelo cadastro, login, pagamento e carrinho com viewport de até 600 px; a declaração não antecipa downloads nas demais telas. Não há chamadas a provedores externos em runtime, preload global, itálicos ou outros pesos/subsets.
