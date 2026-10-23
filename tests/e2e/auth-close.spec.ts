import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-21T12:01:00Z') })
  await page.goto('/')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await page.evaluate(() => fetch('/api/__mock/reset', { method: 'POST' }))
  await page.reload()
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
})

test('fechar Login após acessar perfil retorna ao público sem ciclo no histórico', async ({ page }) => {
  await page.getByRole('link', { name: 'Ver perfil do colecionador' }).click()
  await expect(page).toHaveURL(/\/login\?.*redirect=.*perfil/)
  await page.getByRole('button', { name: 'Fechar autenticação' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await page.goForward()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/perfil')
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible()
})

test('Login direto fecha por X ou Escape sem navegar para destinos privados', async ({ page }) => {
  for (const [path, keyboard] of [
    ['/login?redirect=%2Fperfil&reason=', false],
    ['/login?redirect=%2Fperfil&reason=', true],
    ['/login?redirect=%2Fcarteiras', true],
    ['/login?redirect=%2Ffavoritos', false],
    ['/login?redirect=%2Fpedidos%2Fpedido-anterior', true],
    ['/login', false],
  ] as const) {
    await page.goto(path)
    await expect(page.getByRole('dialog')).toBeVisible()
    if (keyboard) await page.keyboard.press('Escape')
    else await page.getByRole('button', { name: 'Fechar autenticação' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.isConnected && !document.activeElement.closest('dialog, [inert]'))).toBe(true)
  }
})

test('Login válido mantém redirect privado para perfil', async ({ page }) => {
  await page.goto('/login?redirect=%2Fperfil&reason=')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo!123')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/perfil$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana')
  await page.reload()
  await expect(page).toHaveURL(/\/perfil$/)
  await expect(page.getByLabel('Nome de exibição', { exact: false })).toHaveValue('Ana')
})

test('cancelar Login ou Cadastro no checkout preserva carrinho e permite retomada', async ({ page }) => {
  const card = page.getByTestId('nft-emerald-ape-042')
  await card.locator('summary').click()
  const added = page.waitForResponse(response => response.url().endsWith('/api/cart/items') && response.request().method() === 'PUT')
  await card.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  expect((await added).status()).toBe(200)
  await page.goto('/pagamento')
  await expect(page).toHaveURL(/\/login\?.*redirect=.*pagamento/)
  await page.getByRole('button', { name: 'Fechar autenticação' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(page.getByTestId('cart-emerald-ape-042-standard')).toBeVisible()
  await page.getByRole('link', { name: 'Continuar ao checkout', exact: true }).click()
  await page.getByRole('dialog').getByRole('link', { name: /^(Criar conta|Crie uma conta)$/ }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/cadastro\?.*redirect=.*pagamento/)
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(page.getByTestId('cart-emerald-ape-042-standard')).toBeVisible()
  await page.getByRole('link', { name: 'Continuar ao checkout', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('link', { name: /^(Criar conta|Crie uma conta)$/ }).filter({ visible: true }).click()
  await dialog.getByLabel('Nome de usuário').fill('Colecionador Novo')
  await dialog.getByLabel('E-mail', { exact: true }).fill('retomada@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo!123')
  await dialog.getByLabel('Confirmar senha').fill('KurioDemo!123')
  await dialog.getByRole('button', { name: 'Criar perfil', exact: true }).click()
  await expect(page).toHaveURL(/\/pagamento$/)
  await expect(dialog).toHaveCount(0)
  expect(await page.evaluate(async () => {
    const response = await fetch('/api/cart', { headers: { Authorization: `Bearer ${localStorage.getItem('kurio:session-token')}` } })
    const cart = await response.json()
    return { status: response.status, items: cart.items.map((item: { nftId: string; quantity: number }) => ({ nftId: item.nftId, quantity: item.quantity })) }
  })).toEqual({ status: 200, items: [{ nftId: 'emerald-ape-042', quantity: 1 }] })
})
