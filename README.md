# Kurio | NFT Marketplace

Marketplace de NFTs desenvolvido para o desafio Frontend da Jungle Gaming. Implementa descoberta, conta do colecionador e compra até o recibo, com dados persistentes e integrações simuladas na camada de rede.

**[Demo pública](https://kurio-frontend-challenge.vercel.app/)** · **[Código-fonte](https://github.com/0LucasAlmada0/kurio-frontend-challenge)** · [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) · [Enunciado oficial](https://github.com/junglegaming/frontend-challenge)

Carteiras, pagamentos e transações blockchain são **simulados**. Nenhuma extensão, pagamento real, segredo ou serviço privado é necessário.

## Avaliação rápida

1. Abra a demo e use **Cenários de demonstração → Restaurar cenário** para iniciar com as fixtures padrão. O reset apaga alterações locais e encerra a sessão.
2. Explore busca/filtros, abra um NFT, selecione edição e quantidade e adicione ao carrinho. Teste o cupom `KURIO10`.
3. Entre com uma conta abaixo, selecione carteira/provedor e conecte a carteira simulada. Revise dados, itens e taxas, aceite a cotação e confirme. O recibo aparece somente após confirmação REST.
4. Com um NFT no carrinho, use **Alterar Emerald Ape** para observar preço/estoque atualizados via Socket.IO e a necessidade de revisar uma cotação alterada.

| Conta fictícia | E-mail | Senha |
| --- | --- | --- |
| Ana | `ana@kurio.test` | `KurioDemo!123` |
| Bruno | `bruno@kurio.test` | `KurioDemo!123` |

**Execução local:** `npm ci` → `npx playwright install chromium` → `npm run dev`. Requer Node **≥22.12** e npm; ambiente validado com Node **24.14.1**. Desenvolvimento em `http://127.0.0.1:5173`.

**Verificações:** `npm run typecheck`, `npm run lint`, `npm run build:demo` e Playwright em preview, conforme [comandos de testes](#testes-automatizados). Última regressão: **300/300 aprovados**, sem falhas, retries ou skips. [Relatório HTML final](evidence/delivery-final-2026-10-23/playwright/index.html) · [12 auditorias Lighthouse e métricas](evidence/final-recovery-2026-10-23/README.md#lighthouse-oficial-final--12-medições).

## Funcionalidades implementadas

- Catálogo com busca, filtros combinados, intervalo ETH, ordenação, paginação e restauração pela URL/histórico; detalhe com edição, estoque e quantidade.
- Cadastro/login, sessão após refresh, expiração, proteção de rotas e retorno ao contexto anterior; favoritos otimistas com rollback.
- Carrinho visitante e autenticado, merge após login, persistência, cupons e cotação REST com precisão de até 18 casas decimais.
- Carteiras principal/secundária, conexão simulada, revisão explícita e pedidos idempotentes; estados pendente, confirmado e recusado com recuperação após timeout/refresh/reconexão.
- Perfil com dados, avatar local e senha; isolamento de dados, cache e subscriptions por usuário/sessão.
- Atualizações públicas `nft.updated` e privadas `order.updated`, skeletons, feedback de erro/recuperação e layouts desktop, tablet e mobile.

## Stack e responsabilidades

| Tecnologia | Uso na solução |
| --- | --- |
| React 19, TypeScript strict e Vite | Componentes tipados e build estático |
| TanStack Router | Rotas, guards, search params e carregamento de rotas sob demanda |
| TanStack Query | Consultas, mutations, cache, otimismo, rollback e reconciliação |
| Axios e REST | Cliente HTTP tipado, cancelamento e tratamento de erros |
| MSW | Interceptação de rede, autorização, persistência e cenários determinísticos |
| Socket.IO Client | Eventos reais do protocolo WebSocket, interceptados por `@mswjs/socket.io-binding` |
| Tailwind CSS e shadcn/ui | Tokens, responsividade e componentes adaptados ao Figma |
| Playwright e Lighthouse | Fluxos E2E, baselines visuais e auditorias reproduzíveis |

## Instalação e ambiente

```sh
npm ci
npx playwright install chromium
npm run dev
```

Para avaliar o artefato otimizado com mocks:

```sh
npm run build:demo
npm run preview
```

Abra `http://127.0.0.1:4173`. Não mantenha outro servidor nessa porta durante os testes. No PowerShell com execução de scripts bloqueada, use `npm.cmd` e `npx.cmd`.

| Variável | Configuração da demonstração |
| --- | --- |
| `VITE_ENABLE_MOCKS` | `true`; desenvolvimento habilita por padrão e `.env.demo` habilita no build de demonstração |
| `VITE_API_BASE_URL` | `/api` por padrão; mantenha esse valor para os handlers locais |
| `VITE_SOCKET_URL` | Deixe ausente para usar a origem atual, com WebSocket seguro em HTTPS |

Veja [.env.example](.env.example) e [.env.demo](.env.demo). Não é necessário criar um `.env` privado. Variáveis `VITE_*` são públicas e incorporadas no build; não coloque segredos nelas. `npm run build` valida a variante de produção sem mocks habilitados por padrão, que exige serviços compatíveis; **a demo deve usar `build:demo`**.

O [service worker](public/mockServiceWorker.js) é versionado e requer localhost ou HTTPS. O bootstrap aguarda MSW antes de React/Socket.IO. Ao atualizar deliberadamente MSW, regenere-o com `npx msw init public --save`.

## Fluxos e falhas reproduzíveis

Abra **Cenários de demonstração**, disponível no fim das telas. Selecione o grupo indicado e, ao terminar, volte a `success` ou use **Restaurar cenário**.

| Cenário | Como reproduzir e recuperar |
| --- | --- |
| Lista vazia, erro e lentidão | **Resposta da API** → `empty`, `error`, `slow`, `offline` ou `timeout`; use `success` e **Tentar novamente** |
| Respostas fora de ordem | **Resposta da API** → `variable`; alterne buscas de comprimentos ímpar/par, com latências de 1200/100 ms |
| Login indisponível | **Sessão e favoritos** → `auth-error`; tente entrar e depois selecione `success` |
| Favorito recusado | Autenticado, selecione `favorite-error` e altere um coração: a mudança otimista sofre rollback; `success` permite repetir |
| Expiração e isolamento | Use **Expirar sessão** em uma rota privada; entre novamente. Saia de Ana e entre como Bruno para conferir dados independentes |
| Falha em perfil/carteira | **Sessão e favoritos** → `account-error`; tente salvar e recupere com `success`, sem perder os campos digitados |
| Carrinho indisponível | **Carrinho e cotação** → `network`, `server`, `slow` ou `timeout`; recupere com `success`, preservando itens |
| Cupons | `KURIO10` aplica 10%; `EXPIRADO` retorna expiração; outro código retorna inválido. Remova o cupom para recompor a cotação |
| Preço/estoque alterado | **Alterar Emerald Ape** emite `nft.updated`. No grupo **Checkout e pedidos**, `price`, `sold-out` e `stale` exercitam conflitos no envio |
| Compra recusada | **Checkout e pedidos** → `refused`; confirme e observe recusa/carrinho preservado. Nova tentativa exige ação explícita |
| Resposta perdida após criação | Selecione `timeout` e envie; **Recuperar pedido** reutiliza a mesma chave, sem criar outra compra |
| Pedido pendente/desconexão | Selecione `pending` ou `disconnect`; atualize/reconecte e consulte o mesmo pedido. **Confirmar pendentes** ou **Recusar pendentes** resolve o cenário |

`/nfts/emerald-ape-042` permite acesso direto. Busca, filtros, ordenação e página pertencem à URL. Perfil, carteiras, favoritos, pagamento e pedidos exigem sessão; fechar Login por X/Escape retorna ao contexto público seguro, sem desproteger a rota.

No pagamento mobile, **Revisar compra** abre a revisão; **Confirmar compra** envia somente com conexão, validações, cotação atual e aceite explícito. O recibo usa o snapshot imutável do pedido. Detalhes e endpoints dos cenários estão em [CONTRACTS.md](CONTRACTS.md).

## Testes automatizados

| Comando | Finalidade |
| --- | --- |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint |
| `npm run build` | Build de produção |
| `npm run build:demo` | Build otimizado com MSW |
| `npm run test:e2e` | Suíte Playwright; servidor de desenvolvimento por padrão |
| `npm run test:e2e:report` | Abrir o último relatório HTML local |
| `npm run audit -- nome-da-rodada` | 12 medições Lighthouse em uma pasta própria |

Para a regressão completa da demonstração no PowerShell, após `build:demo`:

```powershell
Remove-Item Env:E2E_BASE_URL -ErrorAction SilentlyContinue
$env:E2E_PREVIEW='true'
npm.cmd run test:e2e -- --retries=0 --workers=2
```

São 100 testes por viewport (1440×1000, 768×1024 e 390×844), em contextos Chromium isolados. O comando limita a dois workers para reduzir a concorrência em ambientes com pouca memória livre. A suíte cobre compra, recuperação, isolamento, eventos, teclado, loading e erros. Relatórios HTML incluem seus recursos; traces/screenshots são retidos em falhas. A última regressão teve **300 aprovados, zero falhas, flaky, retries ou skips**, em **15,7 minutos**, além de 36 testes direcionados aprovados.

Uma rodada anterior com três workers teve 299 aprovações e um `ERR_NO_BUFFER_SPACE` do Chromium antes de carregar a aplicação. O teste passou isoladamente e na regressão integral com dois workers, sem alteração de lógica, timeout ou retries. [Resultados completos e trace preservado](evidence/delivery-final-2026-10-23/README.md#validação-executada). A instalação adicional em pasta isolada, sem `node_modules` anterior, também passou: `npm ci --offline --no-audit --no-fund` reutilizou o cache de pacotes e o build gerou arquivos idênticos ao artefato testado; não é uma medição de download frio do registry.

As [baselines](tests/e2e) são versionadas junto aos testes, incluindo início, detalhe, login/cadastro, carrinho, pagamento e recibo. Foram geradas no Windows com Chromium 156.0.8078.4, instalado pelo Playwright 1.64.1 do lockfile. Não use `--update-snapshots` indiscriminadamente: inspecione e justifique cada mudança. No Linux, fontes/renderização e nomes específicos de plataforma podem exigir uma avaliação separada; os fluxos continuam executáveis.

O GitHub mostra o código dos HTML. Clone/baixe o repositório e execute `npx playwright show-report evidence/delivery-final-2026-10-23/playwright` para navegar no relatório entregue.

## Lighthouse

Última rodada oficial: **12 medições frias**, três por página/perfil, no build de demonstração. Medianas independentes por categoria/métrica:

| Página / perfil | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home desktop | 99 | 100 | 100 | 100 | 790,9 | 0,010748 | 21 |
| Detalhe desktop | 100 | 100 | 100 | 100 | 677,7 | 0 | 13 |
| Home mobile | **88** | 100 | 100 | 100 | 2938,5 | 0,000415 | 274 |
| Detalhe mobile | 90 | 100 | 100 | 100 | 2986,3 | 0,000689 | 209 |

**A Home mobile não atingiu a meta Performance ≥90.** O trabalho inicial de scripts/renderização e o caminho da imagem LCP continuam relevantes. A redução de CSS (81,17 → 72,01 KB) e as dicas de imagens melhoraram o detalhe, mas não confirmaram ganho na Home na rodada oficial. Uma tentativa de separar as seções da Home foi revertida após piora medida. Nenhuma execução desfavorável foi descartada; não se declara aprovação integral das metas.

[Índice dos 12 HTML/JSON](evidence/final-recovery-2026-10-23/README.md#lighthouse-oficial-final--12-medições) · [Medianas originais](evidence/final-recovery-2026-10-23/lighthouse/summary.json) · [Configuração efetiva e verificações MSW/Socket.IO](evidence/final-recovery-2026-10-23/lighthouse/runs.json).

```powershell
npm.cmd run build:demo
Remove-Item Env:LH_PROFILE -ErrorAction SilentlyContinue
npm.cmd run audit -- nova-rodada
```

Use um nome novo para preservar os relatórios anteriores. Não execute E2E simultaneamente. O runner usa [lighthouserc.cjs](lighthouserc.cjs), perfis Chromium novos, cache/storage frios e throttling `simulate` padrão: mobile 412×823/DPR 1,75, CPU 4×/RTT 150 ms/1638,4 Kbps; desktop 1350×940/DPR 1, CPU 1×/RTT 40 ms/10240 Kbps. MSW, REST, Socket.IO, imagens e fontes permanecem ativos; a prova do evento ocorre após a janela medida.

Ambiente: Windows 10.0.26200 x64, Node 24.14.1, Lighthouse 12.6.1, Chromium 156.0.8078.4, i5-10400F e 16 GiB. `CHROME_PATH` permite outro Chromium; `LH_PROFILE=desktop|mobile` limita o perfil. `--diagnostic` usa uma medição por página e não substitui a rodada oficial. Relatórios de novas execuções são gerados localmente; os resultados entregues estão nos links acima.

Localhost não representa a CDN ou um aparelho físico. Respostas MSW podem aparecer com `transferSize=0` no CDP, limitando a simulação Lantern. Best Practices não é uma auditoria completa de segurança. Nesta rodada de modal/documentação não foi necessário repetir Lighthouse; as páginas auditadas preservam sua composição e funcionalidades.

## Arquitetura e decisões

- **Rede como fonte de verdade:** componentes enviam intenções; REST/MSW mantém catálogo, carrinhos e pedidos consistentes. A cotação oficial fornece todos os valores; ETH usa strings e `BigInt` em wei.
- **Sessão e cache:** chaves privadas incluem usuário/sessão. Logout/troca/expiração abortam requests, limpam cache e removem listeners; respostas atrasadas não restauram outra identidade.
- **Tempo real:** Socket.IO Client valida identidade/versão, descarta duplicatas/eventos antigos e reconcilia por REST após eventos/reconexão. A UI não simula eventos com setters.
- **Compra:** uma tentativa persistida mantém chave/payload idempotentes; estoque e pedido são gravados no mesmo snapshot, com serialização por Web Locks quando disponível.
- **UX:** botões sem serviço permanecem inativos e identificados. A revisão de compra exige aceite explícito. Assets, dados reais da API e acessibilidade têm precedência sobre números ilustrativos do Figma.

Responsabilidades, cache/retries, transporte e trade-offs estão em [ARCHITECTURE.md](ARCHITECTURE.md); DTOs, erros e eventos em [CONTRACTS.md](CONTRACTS.md). Roboto Mono Latin 400/700 é local nos escopos revisados, com [origem e licença](src/features/auth/assets/fonts/README.md). Quatro imagens originais e variantes WebP lossless são reutilizadas; não há telas renderizadas como screenshots.

## Publicação e limitações

[vercel.json](vercel.json) configura `npm ci`, `npm run build:demo`, saída `dist`, fallback SPA e revalidação do worker. Para reproduzir a demo, mantenha mocks habilitados, REST em `/api` e socket na origem atual. O site estático não hospeda um servidor Socket.IO externo.

Após publicar manualmente o commit escolhido, confira acesso sem autenticação da Vercel, assets/worker, acesso direto e refresh de rotas, sessão, compra e atualização em tempo real. Smoke público:

```powershell
$env:E2E_BASE_URL='https://kurio-frontend-challenge.vercel.app/'
npm.cmd run test:e2e -- deploy.spec.ts --retries=0
Remove-Item Env:E2E_BASE_URL
```

- Dados persistem somente no navegador/origem. Reset ou outra origem/dispositivo inicia outro estado. Não há backend, segurança de produção, transação distribuída ou broadcast de catálogo entre abas.
- Autenticação é simulada: storage/tokens são inspecionáveis; senhas persistem como salt/hash, sem senha em claro. Não há cookie HttpOnly, OAuth ou recuperação de senha.
- Carteiras/provedores/ENS, taxa de rede e referências de transação são simulados; não há integração blockchain ou explorador real.
- Login social, recuperação, newsletter, páginas editoriais e vistas adicionais da galeria não têm serviço. A apresentação comunica indisponibilidade; uma única vista real por NFT é fornecida pelos assets existentes.
- Fallback sem Web Locks serializa somente a página. Timers são retomados/reconciliados por REST após refresh; fechar a página não executa um backend em segundo plano.
- O aviso de chunk acima de 500 KB permanece. Performance da Home mobile está abaixo da meta; tecnologias assistivas e aparelhos físicos não foram integralmente certificados por testes automatizados.
- A URL pública precisa corresponder ao commit entregue. Alterações locais só chegam ao deploy após publicação manual; nenhum commit, push ou deploy é feito por estes comandos de validação.

## Evidências e documentação complementar

| Material | Conteúdo |
| --- | --- |
| [Último ajuste e validação pré-entrega](evidence/delivery-final-2026-10-23/README.md) | Login desktop/tablet, comparação, baselines e resultados finais |
| [Playwright final](evidence/delivery-final-2026-10-23/playwright/index.html) | 300 testes aprovados e recursos completos do relatório |
| [Verificação das evidências finais](evidence/delivery-final-2026-10-23/verification.json) | Hashes, instalação limpa e integridade do pacote atual |
| [Auditoria e recuperação de performance](evidence/final-recovery-2026-10-23/README.md) | 12 medições oficiais, anteriores ao último ajuste de Login, comparação e limitações |
| [Auditoria inicial](evidence/final-audit-2026-10-23/README.md) | Matriz de conformidade e achados anteriores às correções |
| [Etapa 8 histórica](evidence/etapa8/README.md) | Medições e regressão anteriores; não representam as notas atuais |
| [Home](evidence/visual-05-home/README.md), [Detalhe](evidence/visual-06-detalhe/README.md) e [favoritos](evidence/fix-card-favorites/README.md) | Comparações visuais e decisões das revisões |
| [Histórico técnico](docs/HISTORY.md) | Registros preservados das etapas, comandos, resultados e evidências antigas |
| [Arquitetura](ARCHITECTURE.md) e [contratos](CONTRACTS.md) | Decisões e reprodução detalhada das integrações |

Os HTML/JSON e seus recursos são arquivos do repositório público; baixe-os para abrir os relatórios interativos. O histórico preserva resultados datados e caminhos de trabalho daquela execução, sem substituir as evidências atuais.
