import { test, expect, type Page } from '@playwright/test'
import type { Profile, Session, Wallets, Order, Quote } from '../../src/api/contracts'

const profilePath = '/users/user-ana/profile'
async function api<T>(page: Page, path: string, method = 'GET', body?: unknown, token?: string) {
  return page.evaluate(async ({ path, method, body, token }) => {
    const credential = token ?? localStorage.getItem('kurio:session-token')
    const response = await fetch(`/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: `Bearer ${credential}` } : { 'X-Guest-Cart': localStorage.getItem('kurio:guest-cart')! }) }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, data: await response.json() }
  }, { path, method, body, token }) as Promise<{ status: number; data: T }>
}
async function control(page: Page, path: string, body: unknown = {}) { return api(page, `/__mock/${path}`, 'POST', body) }
async function login(page: Page, path = '/perfil', user = 'ana', password = 'KurioDemo!123') {
  await page.goto(path)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('E-mail', { exact: true }).fill(`${user}@kurio.test`)
  await dialog.getByLabel('Senha', { exact: true }).fill(password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  await expect(dialog).not.toBeVisible()
}
async function saveProfile(page: Page) {
  const response = page.waitForResponse((response) => response.url().endsWith(`/api${profilePath}`) && response.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  const result = await response
  expect(result.fromServiceWorker()).toBe(true)
  return result
}
async function logout(page: Page) {
  const response = page.waitForResponse((response) => response.url().endsWith('/api/session') && response.request().method() === 'DELETE')
  await page.getByRole('complementary').getByRole('button', { name: 'Sair', exact: true }).click()
  expect((await response).status()).toBe(204)
  await expect(page.getByRole('dialog')).toBeVisible()
}
const form = (page: Page, label = 'Principal') => page.getByRole('form', { name: `Editar carteira ${label}`, exact: true })
async function saveWallet(page: Page, target = form(page)) {
  const response = page.waitForResponse((response) => /\/api\/wallets(?:\/[^/]+)?$/.test(response.url()) && ['PUT', 'POST'].includes(response.request().method()))
  await target.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
  return response
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-21T12:01:00Z') })
  await page.goto('/')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  expect((await control(page, 'reset')).status).toBe(200)
  await page.reload()
})

test('perfil e carteiras exigem autenticação e retornam à rota solicitada', async ({ page }) => {
  for (const path of ['/perfil', '/carteiras']) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(`/login\\?.*redirect=.*${path.slice(1)}`))
    await login(page, path)
    await expect(page.getByRole('navigation', { name: 'Navegação da conta' })).toBeVisible()
    await logout(page)
  }
})

test('perfil editado persiste e sincroniza sessão sem apagar carrinho e favoritos', async ({ page }) => {
  await login(page)
  await api(page, '/cart/items', 'PUT', { nftId: 'emerald-ape-042', editionId: 'standard', quantity: 1, operation: 'add' })
  await api(page, '/users/user-ana/favorites/emerald-ape-042', 'PUT')
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Ana Nova')
  await page.getByLabel('Nome de usuário', { exact: false }).fill('ana.nova')
  await page.getByLabel('E-mail', { exact: false }).fill('ANA.NOVA@kurio.test')
  await page.getByLabel('Nome ENS (opcional)').fill('ana.nova.eth')
  await page.getByLabel('Apelido da carteira (público)').fill('Coleção Ana')
  expect((await saveProfile(page)).status()).toBe(200)
  await expect(page.getByRole('status').filter({ hasText: 'Perfil salvo com sucesso.' })).toBeVisible()
  expect((await api<Session>(page, '/session')).data.user).toMatchObject({ name: 'Ana Nova', email: 'ana.nova@kurio.test' })
  await page.reload()
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana Nova')
  await expect(page.getByLabel('Nome de usuário', { exact: false })).toHaveValue('ana.nova')
  await expect(page.getByLabel('E-mail', { exact: false })).toHaveValue('ana.nova@kurio.test')
  expect((await api<{ items: unknown[] }>(page, '/cart')).data.items).toHaveLength(1)
  expect((await api<{ nftIds: string[] }>(page, '/users/user-ana/favorites')).data.nftIds).toEqual(['emerald-ape-042'])
})

test('validação cliente/MSW e conflitos de email, username e versão', async ({ page }) => {
  await login(page)
  await page.getByLabel('Nome de exibição', { exact: false }).fill('A')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toBeFocused()
  const original = (await api<Profile>(page, profilePath)).data
  expect((await api(page, profilePath, 'PUT', { ...original, email: 'invalid' })).status).toBe(422)
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Ana')
  await page.getByLabel('E-mail', { exact: false }).fill('bruno@kurio.test')
  expect((await saveProfile(page)).status()).toBe(409)
  await expect(page.getByLabel('E-mail', { exact: false })).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('E-mail', { exact: false }).fill('ana@kurio.test')
  await page.getByLabel('Nome de usuário', { exact: false }).fill('BRUNO')
  expect((await saveProfile(page)).status()).toBe(409)
  expect((await api(page, profilePath, 'PUT', { ...original, displayName: 'Ana Externa' })).status).toBe(200)
  await page.getByLabel('Nome de usuário', { exact: false }).fill('ana')
  expect((await saveProfile(page)).status()).toBe(409)
  await page.getByRole('button', { name: 'Recarregar dados' }).click()
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana Externa')
})

test('senha atual, confirmação e troca atômica sem persistir texto puro', async ({ page }) => {
  await login(page)
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Ana Segura')
  await page.getByLabel('Senha atual', { exact: true }).fill('Incorreta!123')
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha!456')
  await page.getByLabel('Confirmar nova senha').fill('Diferente!456')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByLabel('Confirmar nova senha')).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Confirmar nova senha').fill('NovaSenha!456')
  expect((await saveProfile(page)).status()).toBe(422)
  expect((await api<Profile>(page, profilePath)).data.displayName).toBe('Ana')
  await page.getByLabel('Senha atual', { exact: true }).fill('KurioDemo!123')
  expect((await saveProfile(page)).status()).toBe(200)
  await expect(page.getByLabel('Senha atual', { exact: true })).toHaveValue('')
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('NovaSenha!456')
  expect((await api(page, '/session', 'POST', { email: 'ana@kurio.test', password: 'KurioDemo!123' })).status).toBe(401)
  await logout(page)
  await login(page, '/perfil', 'ana', 'NovaSenha!456')
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana Segura')
})

test('avatar valida tipo, tamanho e conteúdo; alteração e remoção persistem', async ({ page }) => {
  await login(page)
  const input = page.getByLabel('Arquivo do avatar')
  await input.setInputFiles({ name: 'avatar.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') })
  await expect(page.getByRole('alert')).toContainText('PNG, JPEG ou WebP')
  await input.setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(512 * 1024 + 1) })
  await expect(page.getByRole('alert')).toContainText('512 KB')
  const original = (await api<Profile>(page, profilePath)).data
  expect((await api(page, profilePath, 'PUT', { ...original, avatar: 'data:image/png;base64,AAAA' })).status).toBe(422)
  const png = Buffer.from(await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2; const context = canvas.getContext('2d')!; context.fillStyle = '#d68d49'; context.fillRect(0, 0, 2, 2); return canvas.toDataURL('image/png').split(',')[1]! }), 'base64')
  await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByRole('img', { name: 'Avatar do colecionador' })).toBeVisible()
  expect((await saveProfile(page)).status()).toBe(200)
  await page.reload()
  await expect(page.getByRole('img', { name: 'Avatar do colecionador' })).toBeVisible()
  await page.getByRole('button', { name: 'Remover', exact: true }).click()
  expect((await saveProfile(page)).status()).toBe(200)
  await page.reload()
  await expect(page.getByRole('img', { name: 'Avatar do colecionador' })).toHaveCount(0)
})

test('carteiras: cadastro, edição, duplicata, rede e promoção persistentes', async ({ page }) => {
  await login(page, '/carteiras')
  await page.getByRole('button', { name: 'Adicionar secundária', exact: true }).click()
  const added = page.getByRole('form', { name: 'Cadastrar carteira', exact: true })
  await added.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(added.getByLabel('Apelido da carteira', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await added.getByLabel('Apelido da carteira', { exact: true }).fill('Nova reserva')
  await added.getByLabel('Endereço da carteira', { exact: true }).fill(`0x${'1'.repeat(40)}`)
  expect((await saveWallet(page, added)).status()).toBe(409)
  await expect(form(page).getByLabel('Endereço da carteira', { exact: true })).toHaveAttribute('aria-invalid', 'false')
  await added.getByLabel('Endereço da carteira', { exact: true }).fill(`0x${'3'.repeat(40)}`)
  await added.getByLabel('Rede da nova carteira').selectOption('polygon')
  expect((await saveWallet(page, added)).status()).toBe(200)
  await page.getByRole('button', { name: 'Editar Nova reserva', exact: true }).click()
  const edit = form(page, 'Nova reserva')
  await edit.getByLabel('Apelido da carteira', { exact: true }).fill('Reserva editada')
  await edit.getByLabel('Endereço da carteira', { exact: true }).fill('ana.reserva.eth')
  expect((await saveWallet(page, edit)).status()).toBe(200)
  await page.getByRole('button', { name: 'Definir Reserva editada como principal', exact: true }).click()
  await expect(form(page, 'Reserva editada')).toBeVisible()
  await page.reload()
  await expect(form(page, 'Reserva editada').getByLabel('Endereço da carteira', { exact: true })).toHaveValue('ana.reserva.eth')
  const wallets = (await api<Wallets>(page, '/wallets')).data.items
  expect(wallets.filter((wallet) => wallet.kind === 'primary')).toHaveLength(1)
  expect(wallets.find((wallet) => wallet.label === 'Principal')?.kind).toBe('secondary')
  expect((await api(page, '/wallets/wallet-ana-primary', 'PUT', { ...wallets.find((wallet) => wallet.label === 'Principal'), networkId: 'unknown' })).status).toBe(422)
})

test('carteira alterada atualiza checkout e desconecta endereço anterior', async ({ page }) => {
  await login(page, '/carteiras')
  await api(page, '/wallets/connection', 'POST', { walletId: 'wallet-ana-primary', provider: 'MetaMask' })
  await form(page).getByLabel('Apelido da carteira', { exact: true }).fill('Compras Ana')
  await form(page).getByLabel('Endereço da carteira', { exact: true }).fill(`0x${'4'.repeat(40)}`)
  expect((await saveWallet(page)).status()).toBe(200)
  expect((await api<Wallets>(page, '/wallets')).data.connection).toBeNull()
  await api(page, '/cart/items', 'PUT', { nftId: 'emerald-ape-042', editionId: 'standard', quantity: 1, operation: 'add' })
  await page.goto('/pagamento')
  await expect(page.getByRole('radio', { name: /^Compras Ana/ })).toBeChecked()
  await expect(page.getByRole('textbox', { name: 'Endereço da carteira', exact: true })).toHaveValue(`0x${'4'.repeat(40)}`)
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
  await page.getByRole('radio', { name: 'MetaMask', exact: true }).check()
  await page.getByRole('button', { name: 'Conectar carteira simulada', exact: true }).click()
  await expect(page.getByText('Carteira conectada nesta sessão.', { exact: true })).toBeVisible()
})

test('editar carteira de pedido antigo preserva snapshot imutável', async ({ page }) => {
  await login(page, '/carteiras')
  await api(page, '/cart/items', 'PUT', { nftId: 'emerald-ape-042', editionId: 'standard', quantity: 1, operation: 'add' })
  await api(page, '/wallets/connection', 'POST', { walletId: 'wallet-ana-primary', provider: 'MetaMask' })
  const quote = (await api<Quote>(page, '/cart/quote')).data
  const order = await page.evaluate(async (quoteId) => {
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('kurio:session-token')}`, 'Idempotency-Key': 'snapshot-wallet-unchanged' }, body: JSON.stringify({ quoteId, walletId: 'wallet-ana-primary', networkId: 'ethereum', collector: { displayName: 'Ana', username: 'ana', profileName: 'Ana', email: 'ana@kurio.test', ens: '', referralCode: '', note: '' } }) })
    if (!response.ok) throw new Error(`Order: ${response.status}`)
    return response.json() as Promise<Order>
  }, quote.id)
  await control(page, `orders/${order.id}/resolve`, { status: 'confirmed' })
  await form(page).getByLabel('Endereço da carteira', { exact: true }).fill(`0x${'5'.repeat(40)}`)
  expect((await saveWallet(page)).status()).toBe(200)
  const after = (await api<Order>(page, `/orders/${order.id}`)).data
  expect(after.wallet).toEqual(order.wallet)
  expect(after.quote).toEqual(order.quote)
  await page.goto(`/pedidos/${order.id}`)
  await expect(page.getByTestId('order-status')).toHaveText('confirmed')
  await expect(page.getByText(`0x${'1'.repeat(40)}`, { exact: true })).toBeVisible()
})

test('Ana e Bruno: isolamento e autorização de perfil e carteiras', async ({ page }) => {
  await login(page)
  const before = (await api<Profile>(page, profilePath)).data
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Somente Ana')
  expect((await saveProfile(page)).status()).toBe(200)
  await logout(page)
  await login(page, '/perfil', 'bruno')
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Bruno')
  expect((await api(page, profilePath)).status).toBe(403)
  expect((await api(page, profilePath, 'PUT', { ...before, displayName: 'Invadido' })).status).toBe(403)
  expect((await api(page, '/wallets/wallet-ana-primary', 'PUT', { label: 'Invadida', address: 'ana.eth', networkId: 'ethereum', kind: 'primary' })).status).toBe(403)
  await page.goto('/carteiras')
  await expect(form(page).getByLabel('Endereço da carteira', { exact: true })).toHaveValue(`0x${'2'.repeat(40)}`)
  await logout(page)
  await login(page)
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Somente Ana')
})

test('expiração durante mutation e resposta atrasada não alteram outra sessão', async ({ page }) => {
  await login(page)
  await control(page, 'auth/scenario', { mutationDelay: 1800 })
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Não salvar')
  const sent = page.waitForRequest((request) => request.url().endsWith(`/api${profilePath}`) && request.method() === 'PUT')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await sent
  await control(page, 'auth/expire')
  await expect(page).toHaveURL(/\/login\?.*perfil/)
  await login(page, '/perfil', 'bruno')
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Bruno')
  await logout(page)
  await login(page)
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana')
})

test('falhas recuperáveis no perfil e carteira preservam dados e formulário', async ({ page }) => {
  await login(page)
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Ana Recuperada')
  await control(page, 'auth/scenario', { accountFailure: true })
  expect((await saveProfile(page)).status()).toBe(503)
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana Recuperada')
  await control(page, 'auth/scenario', { accountFailure: false })
  expect((await saveProfile(page)).status()).toBe(200)
  await page.goto('/carteiras')
  await form(page).getByLabel('Apelido da carteira', { exact: true }).fill('Carteira Recuperada')
  await control(page, 'auth/scenario', { accountFailure: true })
  expect((await saveWallet(page)).status()).toBe(503)
  await expect(form(page).getByLabel('Apelido da carteira', { exact: true })).toHaveValue('Carteira Recuperada')
  await control(page, 'auth/scenario', { accountFailure: false })
  expect((await saveWallet(page)).status()).toBe(200)
  await page.reload()
  await expect(form(page, 'Carteira Recuperada')).toBeVisible()
})

test('layout de conta, teclado, autofill, loading e capturas responsivas', async ({ page, context }, testInfo) => {
  await login(page)
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana')
  await page.getByLabel('Nome de exibição', { exact: false }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Nome de usuário', { exact: false })).toBeFocused()
  const cdp = await context.newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument')
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#profile-currentPassword' })
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['autofill'] })
  const styles = await page.getByLabel('Senha atual', { exact: true }).evaluate((input) => ({ matches: input.matches(':autofill'), shadow: getComputedStyle(input).boxShadow, fill: getComputedStyle(input).webkitTextFillColor, background: getComputedStyle(document.body).backgroundColor, foreground: getComputedStyle(document.body).color }))
  expect(styles.matches).toBe(true)
  expect(styles.shadow).toContain(styles.background)
  expect(styles.shadow).toContain('1000px')
  expect(styles.fill).toBe(styles.foreground)
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('heading', { name: 'Perfil do colecionador' }).click()
  await testInfo.attach('perfil', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await control(page, 'auth/scenario', { privateDelay: 1800 })
  await page.getByRole('navigation', { name: 'Navegação da conta' }).getByRole('link', { name: 'Carteiras', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Carregando carteiras' })).toBeVisible()
  await expect(form(page)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await testInfo.attach('carteiras', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
})
