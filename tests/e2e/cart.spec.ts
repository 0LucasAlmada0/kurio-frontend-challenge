import { test, expect, type Page } from '@playwright/test'
import type { Cart, Quote, NftUpdated } from '../../src/api/contracts'

const emerald = 'emerald-ape-042'
const violet = 'violet-nomad-314'
async function control(page: Page, path: string, body: unknown = {}) {
  return page.evaluate(async ({ path, body }) => {
    const response = await fetch(`/api/__mock/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`Control: ${response.status}`)
    return response.json()
  }, { path, body })
}
async function rest<T = Cart>(page: Page, path = '/cart', method = 'GET', body?: unknown) {
  return page.evaluate(async ({ path, method, body }) => {
    const token = localStorage.getItem('kurio:session-token')
    const guest = localStorage.getItem('kurio:guest-cart')!
    const response = await fetch(`/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : { 'X-Guest-Cart': guest }) }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, data: await response.json() }
  }, { path, method, body }) as Promise<{ status: number; data: T }>
}
async function add(page: Page, id = emerald, quantity = 1, edition = '1/50') {
  await page.goto(`/nfts/${id}`)
  const detail = page.getByTestId(`detail-${id}`)
  await detail.getByRole('button', { name: new RegExp(`^Edição ${edition} de `) }).click()
  await detail.getByRole('spinbutton').fill(String(quantity))
  const response = page.waitForResponse((res) => res.url().endsWith('/api/cart/items') && res.request().method() === 'PUT')
  await detail.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  expect((await response).status()).toBe(200)
  await expect(detail.getByRole('status')).toContainText('Adicionado.')
}
async function openCart(page: Page) {
  await page.getByRole('link', { name: 'Carrinho de NFTs', exact: true }).filter({ visible: true }).click()
  await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toBeVisible()
  await expect(page.getByTestId('quote-total')).not.toHaveText('— ETH')
}
function row(page: Page, id = emerald, edition = 'standard') { return page.getByTestId(`cart-${id}-${edition}`) }
async function settled(page: Page) { await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toHaveAttribute('aria-busy', 'false') }
async function login(page: Page, user: 'ana' | 'bruno') {
  await page.getByRole('button', { name: 'Entrar', exact: true }).filter({ visible: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail', { exact: true }).fill(`${user}@kurio.test`)
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo!123')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).not.toBeVisible()
}
async function logout(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) <= 600) {
    const account = page.getByRole('button', { name: /^Conta de / })
    if (!await account.isVisible()) await page.getByRole('link', { name: 'Voltar ao mercado', exact: true }).click()
    await account.click()
  }
  const revoked = page.waitForResponse((response) => response.url().endsWith('/api/session') && response.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  expect((await revoked).status()).toBe(204)
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => console.error('Browser error:', error.message))
  await page.goto('/')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await control(page, 'reset')
  await page.reload()
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
})

test('adicionar pela listagem, escolher edição no detalhe e remover', async ({ page }) => {
  const card = page.getByTestId(`nft-${emerald}`)
  await card.locator('summary').click()
  const response = page.waitForResponse((res) => res.url().endsWith('/api/cart/items') && res.request().method() === 'PUT')
  await card.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  expect((await response).status()).toBe(200)
  await add(page, emerald, 1, '1/10')
  await openCart(page)
  await expect(row(page)).toBeVisible()
  await expect(row(page, emerald, 'limited')).toBeVisible()
  await row(page, emerald, 'limited').getByRole('button', { name: /^Remover / }).click()
  await expect(row(page, emerald, 'limited')).not.toBeVisible()
  await row(page).getByRole('button', { name: /^Remover / }).click()
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  expect((await rest(page)).data.items).toEqual([])
})

test('quantidade válida, limite de estoque e rejeição REST sem perder itens', async ({ page }) => {
  await add(page, emerald, 5)
  await openCart(page)
  await row(page).getByRole('button', { name: /^Aumentar / }).click()
  await expect(row(page).getByRole('spinbutton')).toHaveValue('6')
  await expect(row(page).getByRole('button', { name: /^Aumentar / })).toBeDisabled()
  await settled(page)
  await row(page).getByRole('spinbutton').fill('7')
  await expect(page.getByRole('alert')).toContainText('Apenas 6 unidades disponíveis')
  await expect(row(page).getByRole('spinbutton')).toHaveValue('6')
  expect((await rest(page, '/cart/items', 'PUT', { nftId: emerald, editionId: 'standard', quantity: 1.5 })).status).toBe(422)
  expect((await rest(page)).data.items[0]!.quantity).toBe(6)
  await row(page).getByRole('button', { name: /^Diminuir / }).click()
  await expect(row(page).getByRole('spinbutton')).toHaveValue('5')
})

test('persistência do visitante após refresh e navegação direta', async ({ page }) => {
  await add(page, emerald, 2)
  await page.goto('/carrinho')
  await expect(row(page).getByRole('spinbutton')).toHaveValue('2')
  await page.reload()
  await expect(row(page).getByRole('spinbutton')).toHaveValue('2')
  await expect(page.getByTestId('quote-subtotal')).toHaveText('2.38 ETH')
})

test('merge no login soma edições, aplica estoque e não duplica após refresh', async ({ page }) => {
  await login(page, 'ana')
  await add(page, emerald, 5)
  await logout(page)
  await add(page, emerald, 2)
  await add(page, violet)
  await openCart(page)
  const guestId = await page.evaluate(() => localStorage.getItem('kurio:guest-cart'))
  await login(page, 'ana')
  await expect(row(page).getByRole('spinbutton')).toHaveValue('6')
  await expect(row(page, violet)).toBeVisible()
  await expect(page.getByText(/quantidade ajustada ao estoque/)).toBeVisible()
  expect((await rest(page)).data.ownerId).toBe('user-ana')
  const consumed = await page.evaluate(async (id) => (await fetch('/api/cart', { headers: { 'X-Guest-Cart': id! } })).status, guestId)
  expect(consumed).toBe(410)
  await page.reload()
  await expect(row(page).getByRole('spinbutton')).toHaveValue('6')
})

test('isolamento entre Ana, Bruno e visitante, inclusive credencial expirada', async ({ page }) => {
  await login(page, 'ana')
  await add(page)
  const anaToken = await page.evaluate(() => localStorage.getItem('kurio:session-token'))
  await logout(page)
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await login(page, 'bruno')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await add(page, violet)
  await openCart(page)
  await expect(row(page)).not.toBeVisible()
  expect((await rest(page)).data.ownerId).toBe('user-bruno')
  expect(await page.evaluate(async (token) => (await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } })).status, anaToken)).toBe(401)
  await logout(page)
  await login(page, 'ana')
  await openCart(page)
  await expect(row(page)).toBeVisible()
  await expect(row(page, violet)).not.toBeVisible()
})

test('aplicar e remover cupom mantém cotação oficial', async ({ page }) => {
  await add(page, emerald, 2)
  await openCart(page)
  await page.getByLabel('Código promocional', { exact: true }).fill(' kurio10 ')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByTestId('quote-discount')).toHaveText('(−) 0.238 ETH')
  await expect(page.getByTestId('quote-total')).toHaveText('2.158 ETH')
  await page.reload()
  await expect(page.getByText('KURIO10 aplicado')).toBeVisible()
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(page.getByTestId('quote-total')).toHaveText('2.396 ETH')
  expect((await rest<Quote>(page, '/cart/quote')).data.coupon).toBeNull()
})

test('cupom inválido e expirado não alteram o carrinho', async ({ page }) => {
  await add(page)
  await openCart(page)
  for (const [code, message] of [['INVALIDO', 'Código promocional inválido.'], ['EXPIRADO', 'Este cupom expirou.']]) {
    await page.getByLabel('Código promocional', { exact: true }).fill(code!)
    await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText(message!)
    await expect(page.getByTestId('quote-total')).toHaveText('1.206 ETH')
  }
  expect((await rest(page)).data.coupon).toBeNull()
})

test('precisão de 18 casas, desconto truncado em wei e paridade REST', async ({ page }) => {
  await control(page, `nfts/${emerald}/update`, { priceEth: '1.000000000000000001', editionId: 'standard', available: 6 })
  await add(page, emerald, 3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await openCart(page)
  await page.getByLabel('Código promocional', { exact: true }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByTestId('quote-total')).toHaveText('2.716000000000000003 ETH')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const response = await rest<Quote>(page, '/cart/quote')
  expect(response.data.subtotalEth).toBe('3.000000000000000003')
  expect(response.data.discountEth).toBe('0.3')
  await expect(page.getByTestId('quote-total')).toHaveText(`${response.data.totalEth} ETH`)
  expect((await rest(page, '/cart/quote/validate', 'POST', { id: response.data.id })).status).toBe(200)
})

test('Socket.IO altera preço, invalida cotação e ignora duplicatas e eventos antigos', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:01:00Z'))
  await add(page, emerald, 2)
  await openCart(page)
  const previous = (await rest<Quote>(page, '/cart/quote')).data
  const event = await control(page, `nfts/${emerald}/update`) as NftUpdated
  await expect(page.getByTestId('quote-subtotal')).toHaveText('2.98 ETH')
  await expect(page.getByText('Preço ou disponibilidade alterados. Cotação atualizada.')).toBeVisible()
  expect((await rest(page, '/cart/quote/validate', 'POST', { id: previous.id })).status).toBe(409)
  const updated = (await rest<Quote>(page, '/cart/quote')).data
  expect(updated.id).not.toBe(previous.id)
  await control(page, 'events/replay', event)
  await control(page, 'events/replay', { ...event, version: 1, resource: { ...event.resource, version: 1, priceEth: '0.01' } })
  await control(page, 'events/replay', { ...event, version: 9, resource: { ...event.resource, version: 9, editions: [null] } })
  await expect(page.getByTestId('live-event')).toHaveAttribute('data-received', '1')
  await expect(page.getByTestId('quote-subtotal')).toHaveText('2.98 ETH')
  expect((await rest<Quote>(page, '/cart/quote')).data.id).toBe(updated.id)
})

test('vencimento renova cotação e expiração da sessão preserva o carrinho da conta', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-21T12:01:00Z') })
  await login(page, 'ana')
  await add(page)
  await openCart(page)
  const old = (await rest<Quote>(page, '/cart/quote')).data
  await page.clock.fastForward(5 * 60_000)
  expect((await rest(page, '/cart/quote/validate', 'POST', { id: old.id })).status).toBe(409)
  await expect(page.getByTestId('quote-total')).toHaveText('1.206 ETH')
  expect((await rest<Quote>(page, '/cart/quote')).data.id).not.toBe(old.id)
  await control(page, 'auth/expire')
  await page.reload()
  await expect(page).toHaveURL(/\/login\?.*redirect=.*carrinho/)
  await expect(page.getByRole('dialog').getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo!123')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(row(page)).toBeVisible()
})

test('edição esgotada bloqueia adição e sinaliza item já no carrinho', async ({ page }) => {
  await add(page)
  await openCart(page)
  await control(page, `nfts/${emerald}/update`, { editionId: 'standard', available: 0 })
  await expect(row(page).getByRole('alert')).toContainText('Edição esgotada')
  expect((await rest<Quote>(page, '/cart/quote')).data.valid).toBe(false)
  expect((await rest(page, '/cart/items', 'PUT', { nftId: emerald, editionId: 'standard', quantity: 1 })).status).toBe(409)
  await page.goto(`/nfts/${emerald}`)
  const detail = page.getByTestId(`detail-${emerald}`)
  await detail.getByRole('button', { name: /^Edição 1\/50 de / }).click()
  await expect(detail.getByRole('button', { name: 'Adicionar ao carrinho', exact: true })).toBeDisabled()
  await expect(detail.getByRole('status')).toHaveText('Edição esgotada.')
})

test('falhas de servidor e rede preservam itens e permitem recuperação', async ({ page }) => {
  await add(page, emerald, 2)
  await openCart(page)
  for (const failure of ['server', 'network']) {
    await control(page, 'cart/scenario', { failure })
    await row(page).getByRole('button', { name: /^Remover / }).click()
    await expect(page.getByRole('alert')).toContainText(failure === 'server' ? 'itens foram preservados' : 'Não foi possível conectar')
    await expect(row(page).getByRole('spinbutton')).toHaveValue('2')
    await control(page, 'cart/scenario', { failure: 'none' })
    expect((await rest(page)).data.items[0]!.quantity).toBe(2)
  }
  await row(page).getByRole('button', { name: /^Diminuir / }).click()
  await expect(row(page).getByRole('spinbutton')).toHaveValue('1')
  await page.reload()
  await expect(row(page).getByRole('spinbutton')).toHaveValue('1')
})

test('resposta privada atrasada não reaparece em outra conta', async ({ page }) => {
  await login(page, 'ana')
  await add(page)
  await control(page, 'cart/scenario', { delay: 2000 })
  await page.getByRole('link', { name: 'Carrinho de NFTs', exact: true }).filter({ visible: true }).click()
  await logout(page)
  await control(page, 'cart/scenario', { delay: 150 })
  await login(page, 'bruno')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await page.waitForTimeout(2200)
  await expect(row(page)).not.toBeVisible()
  expect((await rest(page)).data.ownerId).toBe('user-bruno')
  expect((await rest(page)).data.items).toEqual([])
})

test('layout responsivo, navegação acessível e skeleton do carrinho', async ({ page }) => {
  await add(page, emerald, 2)
  await add(page, violet)
  await add(page, 'ivory-baron-088', 1, '1/10')
  await control(page, 'cart/scenario', { delay: 1800 })
  await page.goto('/carrinho')
  await expect(page.getByRole('status', { name: 'Carregando carrinho' })).toBeVisible()
  await expect(row(page)).toBeVisible()
  await settled(page)
  await control(page, 'cart/scenario', { delay: 150 })
  await expect(page.getByRole('link', { name: 'Continuar ao checkout' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page).toHaveScreenshot('cart.png', { fullPage: true })
  await row(page).getByRole('spinbutton').focus()
  await expect(row(page).getByRole('spinbutton')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(row(page).getByRole('button', { name: /^Aumentar / })).toBeFocused()
})

test('autofill mantém fundo e texto dos tokens no modal e mobile', async ({ page, context }) => {
  await page.goto('/login')
  const password = page.getByRole('dialog').getByLabel('Senha', { exact: true })
  await expect(password).toBeVisible()
  const cdp = await context.newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument')
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'input[autocomplete="current-password"]' })
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['autofill'] })
  const styles = await password.evaluate((input) => ({ matches: input.matches(':autofill'), shadow: getComputedStyle(input).boxShadow, fill: getComputedStyle(input).webkitTextFillColor, foreground: getComputedStyle(input.closest('dialog')!).color, parent: getComputedStyle(input.closest('dialog')!).backgroundColor }))
  expect(styles.matches).toBe(true)
  expect(styles.shadow).toContain(styles.parent)
  expect(styles.shadow).toContain('1000px')
  expect(styles.fill).toBe(styles.foreground)
  await password.focus()
  expect(await password.evaluate((input) => getComputedStyle(input).boxShadow)).toContain(styles.parent)
  await expect(page).toHaveScreenshot('login-autofill.png')
})
