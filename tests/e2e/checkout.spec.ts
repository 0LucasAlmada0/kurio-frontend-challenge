import { test, expect, type Page } from '@playwright/test'
import type { Cart, Collector, Nft, Order, OrderInput, Quote, Session, Wallets } from '../../src/api/contracts'

const nftId = 'emerald-ape-042'
async function control(page: Page, path: string, body: unknown = {}) {
  return page.evaluate(async ({ path, body }) => {
    const response = await fetch(`/api/__mock/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`Control ${path}: ${response.status}`)
    return response.json()
  }, { path, body })
}
async function api<T>(page: Page, path: string, method = 'GET', body?: unknown, key?: string, token?: string) {
  return page.evaluate(async ({ path, method, body, key, token }) => {
    const credential = token ?? localStorage.getItem('kurio:session-token')
    const response = await fetch(`/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: `Bearer ${credential}` } : { 'X-Guest-Cart': localStorage.getItem('kurio:guest-cart')! }), ...(key ? { 'Idempotency-Key': key } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, data: await response.json() }
  }, { path, method, body, key, token }) as Promise<{ status: number; data: T }>
}
async function login(page: Page, user = 'ana') {
  const dialog = page.getByRole('dialog')
  if (!await dialog.isVisible()) await page.getByRole('button', { name: 'Entrar', exact: true }).filter({ visible: true }).click()
  await dialog.getByLabel('E-mail', { exact: true }).fill(`${user}@kurio.test`)
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo!123')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).not.toBeVisible()
}
async function prepare(page: Page, quantity = 1, editionId = 'standard') {
  expect((await api(page, '/cart/items', 'PUT', { nftId, editionId, quantity, operation: 'add' })).status).toBe(200)
  await page.goto('/pagamento')
  await expect(page).toHaveURL(/\/login\?.*redirect=.*pagamento/)
  await login(page)
  await expect(page).toHaveURL(/\/pagamento$/)
  await expect(page.getByTestId('checkout-total')).toBeVisible()
}
async function connect(page: Page, wallet = 'Principal', provider = 'MetaMask') {
  await page.getByRole('radio', { name: new RegExp(`^${wallet}`) }).check()
  await page.getByRole('radio', { name: provider, exact: true }).check()
  await page.getByRole('button', { name: 'Conectar carteira simulada', exact: true }).click()
  await expect(page.getByText('Carteira conectada nesta sessão.', { exact: true })).toBeVisible()
}
async function submit(page: Page) {
  await page.getByRole('checkbox', { name: /Revisei os itens/ }).check()
  const response = page.waitForResponse((response) => response.url().endsWith('/api/orders') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const result = await response
  return { status: result.status(), order: await result.json() as Order, mocked: result.fromServiceWorker(), key: result.request().headers()['idempotency-key']!, input: result.request().postDataJSON() as OrderInput }
}
async function pending(page: Page, quantity = 1) {
  await control(page, 'checkout/scenario', { preset: 'pending' })
  await prepare(page, quantity)
  await connect(page)
  const result = await submit(page)
  expect(result.status).toBe(200)
  await expect(page.getByRole('heading', { name: 'Pedido pendente', exact: true })).toBeVisible()
  return result
}
async function receipt(page: Page) {
  await expect(page.getByTestId('order-status')).toHaveText('confirmed')
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
}
async function logout(page: Page) {
  await page.goto('/')
  if ((page.viewportSize()?.width ?? 1440) <= 600) await page.getByRole('button', { name: /^Conta de / }).click()
  const revoked = page.waitForResponse((response) => response.url().endsWith('/api/session') && response.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  expect((await revoked).status()).toBe(204)
}
const collector: Collector = { displayName: 'Bruno', username: 'bruno', profileName: 'Bruno', email: 'bruno@kurio.test', ens: '', referralCode: '', note: '' }

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => console.error('Browser error:', error.message))
  await page.clock.install({ time: new Date('2026-10-21T12:01:00Z') })
  await page.goto('/')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await control(page, 'reset')
  await page.reload()
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
})

test('catálogo → carrinho → login → checkout → recibo imutável e layout', async ({ page }, testInfo) => {
  const card = page.getByTestId(`nft-${nftId}`)
  await card.locator('summary').click()
  const added = page.waitForResponse((response) => response.url().endsWith('/api/cart/items') && response.request().method() === 'PUT')
  await card.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  expect((await added).fromServiceWorker()).toBe(true)
  await card.getByRole('link', { name: 'Ver carrinho' }).click()
  await page.getByRole('link', { name: 'Continuar ao checkout' }).click()
  await login(page)
  await connect(page)
  await page.getByLabel('Nome de exibição', { exact: false }).fill('A')
  await page.getByRole('checkbox', { name: /Revisei os itens/ }).check()
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('2 a 60 caracteres')
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Ana Colecionadora')
  await page.getByRole('checkbox', { name: /Revisei os itens/ }).check()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }))
  await testInfo.attach('pagamento-sem-mascara', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await expect(page).toHaveScreenshot('checkout.png', { fullPage: true })
  const result = await submit(page)
  expect(result.status).toBe(200)
  expect(result.mocked).toBe(true)
  expect(result.order.status).toBe('pending')
  await receipt(page)
  await expect(page.getByTestId('receipt-total')).toHaveText('1.206 ETH')
  const stored = (await api<Order>(page, `/orders/${result.order.id}`)).data
  await testInfo.attach('recibo-sem-mascara', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await expect(page).toHaveScreenshot('receipt.png', { fullPage: true, mask: [page.getByTestId('transaction-id'), page.getByTestId('order-id')] })
  await control(page, `nfts/${nftId}/update`, { priceEth: '7.123456789012345678', editionId: 'standard', available: 1 })
  await page.reload()
  await receipt(page)
  await expect(page.getByTestId('receipt-total')).toHaveText('1.206 ETH')
  expect((await api<Order>(page, `/orders/${result.order.id}`)).data.quote).toEqual(stored.quote)
  expect((await api<Cart>(page, '/cart')).data.items).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('carteiras: validação, cadastro, principal/secundária, rede e persistência', async ({ page }) => {
  await prepare(page)
  await page.getByRole('radio', { name: /^Reserva/ }).check()
  await expect(page.getByLabel('Rede', { exact: true })).toHaveValue('polygon')
  await connect(page, 'Reserva', 'Coinbase Wallet')
  await page.getByRole('button', { name: 'Desconectar carteira' }).click()
  await expect(page.getByText('Carteira conectada nesta sessão.')).not.toBeVisible()
  await page.getByText('Cadastrar carteira', { exact: true }).click()
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Informe de 2 a 60 caracteres.', { exact: true })).toBeVisible()
  const label = page.getByLabel('Apelido da carteira')
  await expect(label).toHaveAttribute('aria-invalid', 'true')
  const description = await label.getAttribute('aria-describedby')
  expect(description).toBeTruthy()
  await expect(page.locator(`[id="${description}"]`)).toHaveText('Informe de 2 a 60 caracteres.')
  await page.getByLabel('Apelido da carteira').fill('Minha nova')
  await page.getByLabel('Endereço da carteira', { exact: true }).last().fill('colecionadora.kurio.eth')
  await page.getByLabel('Rede da nova carteira').selectOption('polygon')
  await page.getByLabel('Tipo da carteira').selectOption('primary')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('radio', { name: /^Minha nova/ })).toBeVisible()
  await connect(page, 'Minha nova', 'WalletConnect')
  await page.reload()
  await expect(page.getByRole('radio', { name: /^Minha nova/ })).toBeChecked()
  await expect(page.getByLabel('Rede', { exact: true })).toHaveValue('polygon')
  const wallets = (await api<Wallets>(page, '/wallets')).data
  expect(wallets.items.filter((wallet) => wallet.kind === 'primary')).toHaveLength(1)
  expect(wallets.connection?.provider).toBe('WalletConnect')
})

test('recusa de conexão bloqueia compra e permite recuperação', async ({ page }) => {
  await prepare(page)
  await control(page, 'checkout/scenario', { preset: 'connection-refused' })
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await expect(page.getByRole('alert')).toContainText('Conexão da carteira recusada')
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toEqual([])
  await control(page, 'checkout/scenario', { preset: 'success' })
  await connect(page)
  await submit(page)
  await receipt(page)
})

test('Socket.IO altera a cotação aberta e exige nova revisão explícita', async ({ page }) => {
  await prepare(page)
  await connect(page)
  await page.getByRole('checkbox', { name: /Revisei os itens/ }).check()
  const previous = (await api<Quote>(page, '/cart/quote')).data
  await control(page, `nfts/${nftId}/update`, { priceEth: '1.49' })
  await expect(page.getByTestId('live-event')).toHaveAttribute('data-received', '1')
  await expect(page.getByTestId('checkout-total')).toHaveText('1.506 ETH')
  await expect(page.getByRole('checkbox', { name: /Revisei os itens/ })).not.toBeChecked()
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
  expect((await api(page, '/cart/quote/validate', 'POST', { id: previous.id })).status).toBe(409)
  await submit(page)
  await receipt(page)
  await expect(page.getByTestId('receipt-total')).toHaveText('1.506 ETH')
})

test('validação final dentro do pedido fecha o intervalo entre cotar e confirmar', async ({ page }) => {
  await prepare(page)
  await connect(page)
  await control(page, 'checkout/scenario', { preset: 'price' })
  const refused = await submit(page)
  expect(refused.status).toBe(409)
  await expect(page.getByRole('alert')).toContainText('Cotação alterada ou vencida')
  await expect(page.getByTestId('checkout-total')).toHaveText('1.506 ETH')
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toEqual([])
  const current = (await api<Quote>(page, '/cart/quote')).data
  const changedKey = await api<{ code: string }>(page, '/orders', 'POST', { ...refused.input, quoteId: current.id }, refused.key)
  expect(changedKey.status).toBe(409)
  expect(changedKey.data.code).toBe('IDEMPOTENCY_CONFLICT')
  const accepted = await submit(page)
  expect(accepted.key).not.toBe(refused.key)
  await receipt(page)
})

test('cotação vencida recusa criação e exige confirmar uma nova cotação', async ({ page }) => {
  await prepare(page)
  await connect(page)
  const previous = (await api<Quote>(page, '/cart/quote')).data
  await page.getByRole('checkbox', { name: /Revisei os itens/ }).check()
  await page.clock.fastForward(5 * 60_000)
  const expired = await api(page, '/orders', 'POST', { quoteId: previous.id, walletId: 'wallet-ana-primary', networkId: 'ethereum', collector: { ...collector, displayName: 'Ana', username: 'ana', profileName: 'Ana', email: 'ana@kurio.test' } }, crypto.randomUUID())
  expect(expired.status).toBe(409)
  await expect(page.getByRole('checkbox', { name: /Revisei os itens/ })).not.toBeChecked()
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toHaveLength(0)
  await submit(page)
  await receipt(page)
})

test('edição esgotada no commit impede pedido e preserva carrinho', async ({ page }) => {
  await prepare(page)
  await connect(page)
  await control(page, 'checkout/scenario', { preset: 'sold-out' })
  expect((await submit(page)).status).toBe(409)
  await expect(page.getByText('Edição esgotada. Remova este item.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
  expect((await api<Cart>(page, '/cart')).data.items[0]!.quantity).toBe(1)
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toHaveLength(0)
})

test('clique repetido cria somente um pedido e mantém pending distinto de confirmed', async ({ page }) => {
  await control(page, 'checkout/scenario', { preset: 'pending' })
  await prepare(page)
  await connect(page)
  const requests: string[] = []
  page.on('request', (request) => { if (request.url().endsWith('/api/orders') && request.method() === 'POST') requests.push(request.headers()['idempotency-key']!) })
  await page.getByRole('checkbox', { name: /Revisei os itens/ }).check()
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).dblclick()
  await expect(page.getByRole('heading', { name: 'Pedido pendente', exact: true })).toBeVisible()
  expect(requests).toHaveLength(1)
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toHaveLength(1)
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).not.toBeVisible()
  await expect(page.getByTestId('order-status')).toHaveText('pending')
})

test('timeout após criação recupera a mesma chave e o mesmo pedido', async ({ page }) => {
  await prepare(page)
  await connect(page)
  await control(page, 'checkout/scenario', { preset: 'timeout' })
  const posted = page.waitForRequest((request) => request.url().endsWith('/api/orders') && request.method() === 'POST')
  await page.getByRole('checkbox', { name: /Revisei os itens/ }).check()
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const request = await posted
  const failed = page.waitForEvent('requestfailed', { predicate: (request) => request.url().endsWith('/api/orders') && request.method() === 'POST', timeout: 12000 })
  // A private event may trigger REST recovery before the lost POST acknowledgement times out.
  await failed
  const orders = (await api<{ items: Order[] }>(page, '/orders')).data.items
  expect(orders).toHaveLength(1)
  const repeated = await api<Order>(page, '/orders', 'POST', request.postDataJSON(), request.headers()['idempotency-key'])
  expect(repeated.status).toBe(200)
  expect(repeated.data.id).toBe(orders[0]!.id)
  if (await page.getByRole('button', { name: 'Recuperar pedido', exact: true }).isVisible()) await page.getByRole('button', { name: 'Recuperar pedido', exact: true }).click()
  await receipt(page)
  await page.reload()
  await receipt(page)
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toHaveLength(1)
})

test('idempotency key com conteúdo diferente retorna conflito', async ({ page }) => {
  const result = await pending(page)
  const repeated = await api<Order>(page, '/orders', 'POST', result.input, result.key)
  expect(repeated.status).toBe(200)
  expect(repeated.data.id).toBe(result.order.id)
  const conflict = await api<{ code: string }>(page, '/orders', 'POST', { ...result.input, collector: { ...result.input.collector, note: 'Outro conteúdo' } }, result.key)
  expect(conflict.status).toBe(409)
  expect(conflict.data.code).toBe('IDEMPOTENCY_CONFLICT')
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toHaveLength(1)
})

test('pending sobrevive refresh e reconexão descobre confirmação perdida por REST', async ({ page }) => {
  const result = await pending(page)
  await page.reload()
  await expect(page.getByTestId('order-status')).toHaveText('pending')
  await control(page, 'disconnect')
  await expect(page.getByTestId('socket-status')).toHaveText('○ Reconectando')
  await control(page, `orders/${result.order.id}/resolve`, { status: 'confirmed' })
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await receipt(page)
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toHaveLength(1)
})

test('order.updated privado passa pelo cliente Socket.IO; duplicatas e regressões são ignoradas', async ({ page }) => {
  const result = await pending(page)
  const session = (await api<Session>(page, '/session')).data
  await control(page, `orders/${result.order.id}/resolve`, { status: 'confirmed' })
  await receipt(page)
  const live = page.getByTestId('order-live')
  await expect(live).not.toHaveAttribute('data-received', '0')
  const count = await live.getAttribute('data-received')
  const event = { eventId: `${result.order.id}:v2`, scope: 'private', userId: session.user.id, sessionId: session.id, resourceId: result.order.id, version: 2, status: 'confirmed' }
  await control(page, 'orders/replay', event)
  await control(page, 'orders/replay', { ...event, version: 1, status: 'pending' })
  await control(page, 'orders/replay', { ...event, version: 3, status: 'refused' })
  await expect(live).toHaveAttribute('data-received', count!)
  await expect(page.getByTestId('order-status')).toHaveText('confirmed')
  expect((await api<Cart>(page, '/cart')).data.items).toHaveLength(0)
})

test('pedidos e carteiras isolados entre Ana e Bruno após troca de sessão', async ({ page }) => {
  const ana = await pending(page)
  const oldSession = (await api<Session>(page, '/session')).data
  await logout(page)
  await login(page, 'bruno')
  await page.goto(`/pedidos/${ana.order.id}`)
  await expect(page.getByRole('alert')).toContainText('Este pedido pertence a outro usuário')
  expect((await api<Order>(page, `/orders/${ana.order.id}`)).status).toBe(403)
  expect((await api<Wallets>(page, '/wallets')).data.items.every((wallet) => wallet.userId === 'user-bruno')).toBe(true)
  expect((await api(page, '/wallets/connection', 'POST', { walletId: 'wallet-ana-primary', provider: 'MetaMask' })).status).toBe(403)
  await control(page, `orders/${ana.order.id}/resolve`, { status: 'confirmed' })
  await control(page, 'orders/replay', { eventId: `${ana.order.id}:v2`, scope: 'private', userId: oldSession.user.id, sessionId: oldSession.id, resourceId: ana.order.id, version: 2, status: 'confirmed' })
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).not.toBeVisible()
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toEqual([])
  expect((await api<Order>(page, `/orders/${ana.order.id}`, 'GET', undefined, undefined, oldSession.token)).status).toBe(401)
})

test('recusa libera reserva, preserva carrinho e permite nova tentativa intencional', async ({ page }) => {
  const before = (await api<Nft>(page, `/nfts/${nftId}`)).data
  await prepare(page, 2)
  await connect(page)
  await control(page, 'checkout/scenario', { preset: 'refused' })
  const first = await submit(page)
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  expect((await api<Cart>(page, '/cart')).data.items[0]!.quantity).toBe(2)
  expect((await api<Nft>(page, `/nfts/${nftId}`)).data.available).toBe(before.available)
  await expect(page.getByTestId('order-status')).toHaveText('refused')
  await control(page, 'checkout/scenario', { preset: 'success' })
  await page.getByRole('button', { name: 'Iniciar nova tentativa' }).click()
  await expect(page.getByTestId('checkout-total')).toBeVisible()
  const second = await submit(page)
  expect(second.key).not.toBe(first.key)
  expect(second.order.id).not.toBe(first.order.id)
  await receipt(page)
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toHaveLength(2)
})

test('confirmação remove só quantidades compradas e preserva acréscimos posteriores', async ({ page }) => {
  const result = await pending(page, 2)
  expect((await api(page, '/cart/items', 'PUT', { nftId, editionId: 'standard', quantity: 1, operation: 'add' })).status).toBe(200)
  expect((await api(page, '/cart/items', 'PUT', { nftId: 'violet-nomad-314', editionId: 'standard', quantity: 1, operation: 'add' })).status).toBe(200)
  await control(page, `orders/${result.order.id}/resolve`, { status: 'confirmed' })
  await receipt(page)
  const cart = (await api<Cart>(page, '/cart')).data
  expect(cart.items.find((item) => item.nftId === nftId)?.quantity).toBe(1)
  expect(cart.items.find((item) => item.nftId === 'violet-nomad-314')?.quantity).toBe(1)
  await control(page, `orders/${result.order.id}/resolve`, { status: 'confirmed' })
  expect((await api<Cart>(page, '/cart')).data).toEqual(cart)
})

test('linha removida e adicionada novamente não é apagada pela confirmação antiga', async ({ page }) => {
  const result = await pending(page, 2)
  await api(page, `/cart/items/${nftId}/standard`, 'DELETE')
  await api(page, '/cart/items', 'PUT', { nftId, editionId: 'standard', quantity: 1 })
  await control(page, `orders/${result.order.id}/resolve`, { status: 'confirmed' })
  await receipt(page)
  expect((await api<Cart>(page, '/cart')).data.items[0]!.quantity).toBe(1)
})

test('reserva e pedido são atômicos para duas compras concorrentes da última edição', async ({ page, context }) => {
  await prepare(page, 1, 'limited')
  await connect(page)
  const quoteA = (await api<Quote>(page, '/cart/quote')).data
  const sessionB = (await api<Session>(page, '/session', 'POST', { email: 'bruno@kurio.test', password: 'KurioDemo!123' }, undefined, '')).data
  await api(page, '/cart/items', 'PUT', { nftId, editionId: 'limited', quantity: 1 }, undefined, sessionB.token)
  await api(page, '/wallets/connection', 'POST', { walletId: 'wallet-bruno-primary', provider: 'MetaMask' }, undefined, sessionB.token)
  const quoteB = (await api<Quote>(page, '/cart/quote', 'GET', undefined, undefined, sessionB.token)).data
  await control(page, 'checkout/scenario', { preset: 'pending' })
  const inputs: OrderInput[] = [{ quoteId: quoteA.id, walletId: 'wallet-ana-primary', networkId: 'ethereum', collector: { ...collector, displayName: 'Ana', username: 'ana', profileName: 'Ana', email: 'ana@kurio.test' } }, { quoteId: quoteB.id, walletId: 'wallet-bruno-primary', networkId: 'ethereum', collector }]
  const second = await context.newPage()
  await second.clock.install({ time: new Date(await page.evaluate(() => Date.now())) })
  await second.goto('/')
  await expect(second.getByTestId('socket-status')).toHaveText('● Ao vivo')
  const results = await Promise.all([api<Order>(page, '/orders', 'POST', inputs[0], crypto.randomUUID()), api<Order>(second, '/orders', 'POST', inputs[1], crypto.randomUUID(), sessionB.token)])
  expect(results.map((result) => result.status).sort()).toEqual([200, 409])
  expect((await api<Nft>(page, `/nfts/${nftId}`)).data.editions.find((edition) => edition.id === 'limited')?.available).toBe(0)
  await second.close()
})

test('sessão expirada no checkout preserva dados e retoma após autenticar', async ({ page }) => {
  await prepare(page)
  await connect(page)
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Ana Retomada')
  await control(page, 'checkout/scenario', { preset: 'session-expired' })
  const response = await submit(page)
  expect(response.status).toBe(401)
  await expect(page).toHaveURL(/\/login\?.*redirect=.*pagamento/)
  await login(page)
  await page.getByRole('button', { name: 'Recuperar pedido' }).click()
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana Retomada')
  await connect(page)
  await submit(page)
  await receipt(page)
  expect((await api<{ items: Order[] }>(page, '/orders')).data.items).toHaveLength(1)
})
