# Revisão visual 03.1 · CTA do pagamento mobile

Única alteração na aplicação: texto condicional em `src/features/checkout/page.tsx`.

- Revisão fechada: **Revisar compra**, `type="button"`, sem associação ao formulário. Abre a revisão e preserva o foco no título ou no primeiro campo inválido.
- Revisão aberta: **Confirmar compra**, `type="submit"` associado a `collector-form`, com os bloqueios anteriores de conexão, cotação, dados, aceite e envio pendente.

Não foram alterados handlers, validações, mutations, idempotência, recuperação, CSS, desktop, login ou cadastro. A documentação atual do README/ARCHITECTURE acompanha os novos rótulos; as evidências da revisão 03 permanecem históricas e intactas.

## Impacto visual

Capturas em preview do build de demonstração, com fontes carregadas e a mesma fixture fictícia de Ana. Os arquivos “antes” são as capturas aprovadas da revisão 03; os novos usam o mesmo cenário, viewport e relógio.

| Viewport | Antes / Depois | Botão, antes e depois |
| --- | --- | --- |
| 390 × 844 | [Antes](before-390.png) · [Depois](after-390.png) | x=28, y=752, 334 × 60px |
| 414 × 896 | [Antes](before-414.png) · [Depois](after-414.png) | x=28, y=804, 358 × 60px |

As diferenças de pixels ficaram inteiramente dentro dos caracteres do CTA. Nenhum deslocamento ou overflow horizontal foi encontrado. [Coordenadas e comparação de pixels](verification.json).

## Validação

`tests/e2e/checkout.spec.ts` verifica os dois nomes acessíveis, os atributos de botão/envio, abertura por Enter, foco, largura/altura e ausência de overflow em 414 × 896, 390 × 844 e 390 × 500. As asserções existentes de nenhum pedido antes do aceite, cotação REST, conexão, precisão ETH e criação confirmada continuam presentes. O cenário inválido verifica o rótulo de revisão e o bloqueio da confirmação após abrir os erros.

- Typecheck, lint e `build:demo`: aprovados.
- `git diff --check`: aprovado.
- Checkout direcionado: **9 aprovados em 53,8s** (três cenários × desktop/tablet/mobile).
- Suíte completa: **267 aprovados em 14 minutos**, sem falhas, skips ou retries.
- Baselines: **nenhuma alterada, adicionada ou removida nesta revisão**, confirmado por SHA-256 em relação ao início da 03.1. A captura existente do checkout abre a revisão, mantendo “Confirmar compra”; não houve diferença que justificasse regenerá-la. As baselines já preparadas das revisões anteriores foram preservadas.

Reprodução (PowerShell):

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build:demo
$env:E2E_PREVIEW='true'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-03-1-direcionados'
npx.cmd playwright test checkout.spec.ts --workers=2 --grep 'pagamento compacto|pagamento sem carteira|dados incompletos' --output=test-results/visual-03-1-direcionados
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/visual-03-1-final'
npx.cmd playwright test --workers=2 --max-failures=1 --output=test-results/visual-03-1-final
```

Relatórios HTML são locais em `playwright-report/visual-03-1-direcionados/` e `playwright-report/visual-03-1-final/`, ambos ignorados pelo Git. As capturas desta pasta podem ser versionadas. Nenhuma dependência, commit ou deploy.
