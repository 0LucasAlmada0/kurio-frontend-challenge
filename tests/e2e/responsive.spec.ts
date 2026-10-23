import { test, expect, type Page, type Locator } from '@playwright/test'
import type { CatalogFacets } from '../../src/api/contracts'
import { ethToWei, weiToEth } from '../../src/lib/eth'

const mobile = (page: Page) => (page.viewportSize()?.width ?? 1440) <= 600
async function panel(page: Page) {
  if (mobile(page)) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  return page.getByRole('complementary', { name: 'Filtros do catálogo' })
}
async function login(page: Page) {
  await page.goto('/perfil')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('KurioDemo!123')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/perfil$/)
}
async function drag(page: Page, slider: Locator, from: number, to: number) {
  await slider.scrollIntoViewIfNeeded()
  const box = (await slider.boundingBox())!
  const x = (position: number) => box.x + 11 + (box.width - 22) * position
  const y = box.y + box.height / 2
  if (mobile(page)) {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x(from), y }] })
    for (let step = 1; step <= 8; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x(from + (to - from) * step / 8), y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
  } else {
    await page.mouse.move(x(from), y)
    await page.mouse.down()
    await page.mouse.move(x(to), y, { steps: 8 })
    await page.mouse.up()
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await page.evaluate(() => fetch('/api/__mock/reset', { method: 'POST' }))
  await page.reload()
  await expect(page.getByRole('article')).toHaveCount(8)
})

test('cards alinhados, imagens proporcionais e favoritos visíveis', async ({ page }, testInfo) => {
  for (const card of await page.getByRole('article').all()) {
    const icon = (await card.locator('.card-favorite svg').boundingBox())!
    expect(icon.width).toBeGreaterThanOrEqual(20)
    expect(icon.height).toBeGreaterThanOrEqual(20)
  }
  if (mobile(page)) {
    const cards = page.getByRole('article')
    for (let index = 0; index < 8; index += 2) {
      const first = cards.nth(index), second = cards.nth(index + 1)
      for (const selector of ['.nft-art', 'h3', '.card-meta', '.card-purchase']) {
        const a = (await first.locator(selector).boundingBox())!, b = (await second.locator(selector).boundingBox())!
        expect(Math.abs(a.y - b.y)).toBeLessThan(1)
        expect(Math.abs(a.height - b.height)).toBeLessThan(1)
      }
      const image = (await first.getByRole('img').boundingBox())!
      expect(Math.abs(image.width - image.height)).toBeLessThan(1)
    }
    await cards.first().locator('summary').click()
    await expect(cards.first().getByRole('button', { name: 'Adicionar ao carrinho', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await cards.first().locator('summary').click()
  }
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }) })
  await testInfo.attach('catalogo-viewport-depois', { body: await page.screenshot(), contentType: 'image/png' })
  await testInfo.attach('catalogo-depois', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await page.evaluate(() => fetch('/api/__mock/nfts/emerald-ape-042/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceEth: '99.000000000000000001' }) }))
  await expect(page.getByTestId('nft-emerald-ape-042').getByTestId('price')).toHaveText('99.000000000000000001 ETH')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('slider duplo aceita teclado e arraste mouse ou touch sem perder precisão REST', async ({ page }) => {
  const facets = await page.evaluate(async () => (await fetch('/api/nfts/filters')).json() as Promise<CatalogFacets>)
  const filters = await panel(page)
  const lower = filters.getByRole('slider', { name: 'Limite inferior de preço em ETH' })
  const upper = filters.getByRole('slider', { name: 'Limite superior de preço em ETH' })
  const min = filters.getByLabel('Preço mínimo em ETH'), max = filters.getByLabel('Preço máximo em ETH')
  await lower.focus()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowRight')
  await expect(min).toHaveValue('0.01')
  await upper.focus()
  await page.keyboard.press('End')
  await page.keyboard.press('ArrowLeft')
  await expect(max).toHaveValue(weiToEth(ethToWei(facets.priceRange.max) - 10n ** 16n))
  await expect(lower).toHaveAttribute('aria-valuetext', '0.01 ETH')
  expect(new URL(page.url()).searchParams.has('minPrice')).toBe(false)
  await lower.focus()
  await page.keyboard.press('Home')
  await upper.focus()
  await page.keyboard.press('End')
  await drag(page, lower, 0, 0.3)
  const draggedMin = await min.inputValue()
  expect(ethToWei(draggedMin as `${number}.${number}`)).toBeGreaterThan(0n)
  await drag(page, upper, 1, 0.8)
  const draggedMax = await max.inputValue()
  expect(ethToWei(draggedMax as `${number}.${number}`)).toBeLessThan(ethToWei(facets.priceRange.max))
  const response = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/nfts' && new URL(response.url()).searchParams.get('minPrice') === draggedMin)
  await filters.getByRole('button', { name: 'Aplicar', exact: true }).click()
  expect((await response).fromServiceWorker()).toBe(true)
  expect(new URL(page.url()).searchParams.get('maxPrice')).toBe(draggedMax)
  await min.fill('1.000000000000000001')
  await max.fill('1.000000000000000002')
  await filters.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page).toHaveURL(/minPrice=1\.000000000000000001/)
  await page.reload()
  const restored = await panel(page)
  await expect(restored.getByLabel('Preço mínimo em ETH')).toHaveValue('1.000000000000000001')
  await expect(restored.getByRole('slider', { name: 'Limite superior de preço em ETH' })).toHaveAttribute('aria-valuetext', '1.000000000000000002 ETH')
  await restored.getByRole('slider', { name: 'Limite inferior de preço em ETH' }).focus()
  await page.keyboard.press('End')
  await expect(restored.getByLabel('Preço mínimo em ETH')).toHaveValue('1.000000000000000002')
  await restored.getByRole('slider', { name: 'Limite superior de preço em ETH' }).focus()
  await page.keyboard.press('Home')
  await expect(restored.getByLabel('Preço máximo em ETH')).toHaveValue('1.000000000000000002')
})

test('painel rolável mantém ação inferior acessível em viewport curta', async ({ page }, testInfo) => {
  if (!mobile(page)) { await expect((await panel(page)).getByRole('slider')).toHaveCount(2); return }
  const filters = await panel(page)
  const dialog = page.getByRole('dialog', { name: 'Filtros de NFTs' })
  const result = dialog.getByRole('button', { name: 'Ver resultados' })
  for (const height of [844, 600]) {
    await page.setViewportSize({ width: 390, height })
    await filters.getByLabel('Esgotados', { exact: true }).focus()
    await expect.poll(async () => {
      const option = (await filters.getByLabel('Esgotados', { exact: true }).boundingBox())!
      return option.y + option.height < (await result.boundingBox())!.y
    }).toBe(true)
    const footer = (await result.boundingBox())!
    expect(footer.y + footer.height).toBeLessThanOrEqual(height - 16)
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await dialog.locator('.filter-drawer-body').evaluate((element) => { element.scrollTop = 0 })
  await testInfo.attach('filtros-depois', { body: await page.screenshot(), contentType: 'image/png' })
  await result.click()
  await expect(page.getByRole('button', { name: 'Abrir filtros' })).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})

test('formulários e conta sem overflow e foco acima da navegação inferior', async ({ page }, testInfo) => {
  for (const path of ['/login', '/cadastro']) {
    await page.goto(path)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  }
  await login(page)
  for (const path of ['/perfil', '/carteiras']) {
    if (path === '/carteiras') await page.goto(path)
    const content = page.locator('.account-content')
    await expect(content.locator('input').first()).toHaveValue('Ana')
    const controls = content.locator('input:not([type="file"]), select, button:not(:disabled)')
    for (const control of await controls.all()) {
      await control.focus()
      await expect.poll(() => control.evaluate((element) => {
        const nav = document.querySelector('.mobile-nav')!
        const limit = nav.getClientRects().length ? nav.getBoundingClientRect().top - 44 : innerHeight
        const rect = element.getBoundingClientRect()
        return rect.top >= 0 && rect.bottom <= limit
      })).toBe(true)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await testInfo.attach(`${path.slice(1)}-final-formulario`, { body: await page.screenshot(), contentType: 'image/png' })
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }) })
    await testInfo.attach(`${path.slice(1)}-depois`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  }
  if (mobile(page)) {
    const nav = page.getByRole('navigation', { name: 'Navegação mobile' })
    await nav.getByRole('button', { name: 'Conta de Ana' }).click()
    const menu = nav.locator('.mobile-account')
    await expect(menu).toBeVisible()
    const menuBox = (await menu.boundingBox())!, navBox = (await nav.boundingBox())!
    expect(menuBox.y).toBeGreaterThanOrEqual(0)
    expect(menuBox.y + menuBox.height).toBeLessThan(navBox.y)
    const profileLink = menu.getByRole('link', { name: 'Meu perfil', exact: true })
    expect((await profileLink.boundingBox())!.width).toBeGreaterThan(150)
    expect((await profileLink.boundingBox())!.height).toBeLessThanOrEqual(40)
    await testInfo.attach('conta-depois', { body: await page.screenshot(), contentType: 'image/png' })
    await profileLink.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(menu).not.toBeVisible()
  }
})
