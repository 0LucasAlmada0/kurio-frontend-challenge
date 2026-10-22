import { test, expect, type Page } from '@playwright/test'
import type { NftList, NftUpdated } from '../../src/api/contracts'

async function control(page: Page, path: string, body: unknown = {}) {
  return page.evaluate(async ({ path, body }) => {
    const response = await fetch(`/api/__mock/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`Control ${response.status}`)
    return response.json()
  }, { path, body })
}
async function search(page: Page, query: string) {
  const input = page.getByLabel('Buscar NFTs')
  if ((page.viewportSize()?.width ?? 1440) > 600 && !await input.isVisible()) await page.getByRole('link', { name: 'Ir para busca de NFTs' }).click()
  await expect(input).toBeVisible()
  await input.fill(query)
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
}
async function filters(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) <= 600 && !await page.getByRole('dialog', { name: 'Filtros de NFTs' }).isVisible()) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  return page.getByRole('complementary', { name: 'Filtros do catálogo' })
}
async function closeFilters(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Filtros de NFTs' })
  if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Ver resultados', exact: true }).click()
}
const ids = (page: Page) => page.getByRole('article').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-testid')!.replace(/^nft-/, '')))
async function count(page: Page, total: number, shown = Math.min(total, 8)) {
  await expect(page.locator('.catalog-count')).toHaveText(`${total} colecionáveis`)
  await expect(page.getByRole('article')).toHaveCount(shown)
}
async function read(page: Page, query: string) {
  return page.evaluate(async (query) => {
    const response = await fetch(`/api/nfts?${query}`)
    if (!response.ok) throw new Error(`Catalog ${response.status}`)
    return response.json() as Promise<NftList>
  }, query)
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-21T12:01:00Z') })
  await page.goto('/')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await control(page, 'reset')
  await page.reload()
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
})

test('busca textual efetiva na REST e busca sem resultados com limpeza', async ({ page }) => {
  const response = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/nfts' && new URL(response.url()).searchParams.get('q') === 'Emerald')
  await search(page, 'Emerald')
  const received = await response
  expect(received.fromServiceWorker()).toBe(true)
  expect((await received.json() as NftList).total).toBe(3)
  await count(page, 3)
  await search(page, 'inexistente-xyz')
  await count(page, 0)
  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros e busca' }).click()
  await count(page, 12)
  await expect(page).toHaveURL(/\/$/)
})

test('busca, coleção, raridade, preço e disponibilidade combinam no servidor', async ({ page }) => {
  await search(page, 'Emerald')
  const panel = await filters(page)
  await panel.getByLabel('Kurio Studio', { exact: true }).check()
  await panel.getByLabel('Raro', { exact: true }).check()
  await panel.getByLabel('Disponíveis', { exact: true }).check()
  await panel.getByLabel('Preço mínimo em ETH').fill('1.19')
  await panel.getByLabel('Preço máximo em ETH').fill('1.19')
  const response = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/nfts' && new URL(response.url()).searchParams.get('maxPrice') === '1.19')
  await panel.getByRole('button', { name: 'Aplicar', exact: true }).click()
  const received = await response
  expect(received.fromServiceWorker()).toBe(true)
  const params = new URL(received.url()).searchParams
  expect(Object.fromEntries(params)).toMatchObject({ q: 'Emerald', collections: 'Kurio Studio', rarities: 'raro', availability: 'available', minPrice: '1.19', maxPrice: '1.19' })
  await closeFilters(page)
  await count(page, 1)
  expect(await ids(page)).toEqual(['emerald-ape-042-edition-2'])
  expect((await read(page, params.toString())).items.map((item) => item.id)).toEqual(await ids(page))
})

test('múltiplas coleções usam união; grupos distintos usam interseção', async ({ page }) => {
  const panel = await filters(page)
  await panel.getByLabel('Kurio Apes', { exact: true }).check()
  await count(page, 8)
  await panel.getByLabel('Kurio Studio', { exact: true }).check()
  await count(page, 12)
  await panel.getByLabel('Kurio Apes', { exact: true }).uncheck()
  await panel.getByLabel('Raro', { exact: true }).check()
  await count(page, 2)
  expect(await ids(page)).toEqual(['emerald-ape-042-edition-2', 'golden-beat-207-edition-2'])
  await panel.getByLabel('Comum', { exact: true }).check()
  await count(page, 3)
})

test('limites ETH inclusivos com 18 casas e ordenação sem arredondamento', async ({ page }) => {
  await control(page, 'nfts/emerald-ape-042/update', { priceEth: '1.000000000000000001' })
  await control(page, 'nfts/violet-nomad-314/update', { priceEth: '1.000000000000000002' })
  await page.goto('/?minPrice=1.000000000000000001&maxPrice=1.000000000000000002&sort=price-asc')
  await count(page, 2)
  expect(await ids(page)).toEqual(['emerald-ape-042', 'violet-nomad-314'])
  await page.getByLabel('Ordenar por:').selectOption('price-desc')
  await expect.poll(() => ids(page)).toEqual(['violet-nomad-314', 'emerald-ape-042'])
  const panel = await filters(page)
  await expect(panel.getByLabel('Preço mínimo em ETH')).toHaveValue('1.000000000000000001')
  await panel.getByLabel('Preço mínimo em ETH').fill('1.000000000000000002')
  await panel.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await closeFilters(page)
  await count(page, 1)
  expect(await ids(page)).toEqual(['violet-nomad-314'])
})

test('preço rejeita negativos, precisão excedida e intervalo invertido', async ({ page }) => {
  const panel = await filters(page)
  await panel.getByLabel('Preço mínimo em ETH').fill('-1')
  await panel.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(panel.getByRole('alert')).toContainText('18 casas')
  await panel.getByLabel('Preço mínimo em ETH').fill('1.0000000000000000001')
  await panel.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(panel.getByRole('alert')).toContainText('18 casas')
  await panel.getByLabel('Preço mínimo em ETH').fill('2')
  await panel.getByLabel('Preço máximo em ETH').fill('1')
  await panel.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(panel.getByRole('alert')).toContainText('menor ou igual')
  await panel.getByLabel('Preço mínimo em ETH').fill('1,19')
  await panel.getByLabel('Preço máximo em ETH').fill('1.19')
  await panel.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await closeFilters(page)
  await count(page, 3)
  expect(new URL(page.url()).searchParams.get('minPrice')).toBe('1.19')
})

test('ordenação é estável nos empates e não muda entre consultas', async ({ page }) => {
  await control(page, 'nfts/emerald-ape-042/update', { priceEth: '1.000000000000000001' })
  await control(page, 'nfts/violet-nomad-314/update', { priceEth: '1.000000000000000001' })
  const query = 'minPrice=1.000000000000000001&maxPrice=1.000000000000000001'
  for (const sort of ['price-asc', 'price-desc']) {
    const first = await read(page, `${query}&sort=${sort}`)
    const second = await read(page, `${query}&sort=${sort}`)
    expect(first.items.map((item) => item.id)).toEqual(['emerald-ape-042', 'violet-nomad-314'])
    expect(second).toEqual(first)
  }
})

test('paginação mantém filtros e total correto', async ({ page }) => {
  await page.goto('/?minPrice=0&sort=price-asc')
  await count(page, 12)
  const first = await ids(page)
  await page.getByRole('button', { name: 'Próxima', exact: true }).click()
  await count(page, 12, 4)
  await expect(page.getByText('Página 2 de 2', { exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('minPrice')).toBe('0.0')
  expect((await ids(page)).some((id) => first.includes(id))).toBe(false)
  await expect(page.getByRole('button', { name: 'Próxima', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Anterior', exact: true }).click()
  await count(page, 12)
  expect(await ids(page)).toEqual(first)
})

test('filtro, busca e ordenação reiniciam a página', async ({ page }) => {
  await page.goto('/?page=2')
  await count(page, 12, 4)
  const panel = await filters(page)
  await panel.getByLabel('Kurio Studio', { exact: true }).check()
  await count(page, 4)
  expect(new URL(page.url()).searchParams.has('page')).toBe(false)
  await closeFilters(page)
  await page.goto('/?page=2')
  await search(page, 'Emerald')
  await count(page, 3)
  expect(new URL(page.url()).searchParams.has('page')).toBe(false)
  await page.goto('/?page=2')
  await page.getByLabel('Ordenar por:').selectOption('price-desc')
  await count(page, 12)
  expect(new URL(page.url()).searchParams.has('page')).toBe(false)
})

test('refresh e link compartilhado preservam filtros e campos', async ({ page, context }) => {
  await page.goto('/?q=Emerald&collections=Kurio+Studio&rarities=raro&minPrice=1.19&maxPrice=1.19&availability=available&sort=price-desc')
  await count(page, 1)
  const expected = await ids(page)
  await page.reload()
  await count(page, 1)
  const panel = await filters(page)
  await expect(panel.getByLabel('Kurio Studio', { exact: true })).toBeChecked()
  await expect(panel.getByLabel('Preço máximo em ETH')).toHaveValue('1.19')
  await closeFilters(page)
  const shared = await context.newPage()
  await shared.goto(page.url())
  await count(shared, 1)
  expect(await ids(shared)).toEqual(expected)
  await shared.close()
})

test('voltar e avançar restauram combinações sem perder seleções', async ({ page }) => {
  const panel = await filters(page)
  await panel.getByLabel('Kurio Studio', { exact: true }).check()
  await count(page, 4)
  await panel.getByLabel('Disponíveis', { exact: true }).check()
  await count(page, 3)
  await closeFilters(page)
  await page.getByLabel('Ordenar por:').selectOption('price-desc')
  await expect(page).toHaveURL(/sort=price-desc/)
  await page.goBack()
  await expect(page.getByLabel('Ordenar por:')).toHaveValue('name')
  await count(page, 3)
  await page.goBack()
  await count(page, 4)
  const restored = await filters(page)
  await expect(restored.getByLabel('Todos', { exact: true })).toBeChecked()
  await closeFilters(page)
  await page.goForward()
  await count(page, 3)
})

test('parâmetros inválidos são normalizados e página vazia permite recuperar', async ({ page }) => {
  await page.goto('/?q=%5B1%5D&page=-3&sort=invalid&minPrice=-1&maxPrice=1e3&rarities=unknown&availability=invalid')
  await count(page, 12)
  await expect(page.getByLabel('Ordenar por:')).toHaveValue('name')
  expect((await read(page, 'page=garbage&minPrice=NaN&maxPrice=1e99')).total).toBe(12)
  await page.goto('/?page=999&minPrice=0')
  await count(page, 12, 0)
  await page.getByRole('button', { name: 'Ir para primeira página' }).click()
  await count(page, 12)
  expect(new URL(page.url()).searchParams.get('minPrice')).toBe('0.0')
})

test('latência variável cancela consulta antiga sem sobrescrever resultado recente', async ({ page }) => {
  await control(page, 'scenario', { scenario: 'variable' })
  const sent = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/nfts' && new URL(request.url()).searchParams.get('q') === 'ape')
  await search(page, 'ape')
  await sent
  const canceled = page.waitForEvent('requestfailed', { predicate: (request) => new URL(request.url()).pathname === '/api/nfts' && new URL(request.url()).searchParams.get('q') === 'ape' })
  await search(page, 'golden')
  expect((await canceled).failure()).toBeTruthy()
  await count(page, 3)
  const expected = await ids(page)
  await page.clock.runFor(1500)
  expect(await ids(page)).toEqual(expected)
  expect(expected.every((id) => id.startsWith('golden'))).toBe(true)
})

test('HTTP e falha de conexão permitem tentar novamente mantendo filtros', async ({ page }) => {
  for (const [scenario, query] of [['error', 'Emerald'], ['offline', 'Violet']]) {
    await control(page, 'scenario', { scenario })
    await search(page, query!)
    await expect(page.locator('.catalog-content').getByRole('alert')).toBeVisible()
    await control(page, 'scenario', { scenario: 'success' })
    await page.locator('.catalog-content').getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await count(page, 3)
    await expect(page.getByLabel('Buscar NFTs')).toHaveValue(query!)
  }
})

test('skeleton acessível respeita reduced motion e não mistura contadores', async ({ page }) => {
  await control(page, 'scenario', { scenario: 'slow' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await search(page, 'Emerald')
  const loading = page.getByRole('status', { name: 'Carregando NFTs', exact: true })
  await expect(loading).toBeVisible()
  await expect(page.locator('.catalog-count')).toHaveText('Explorando a coleção')
  expect(await loading.locator('[data-slot="skeleton"]').first().evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  await count(page, 3)
})

test('drawer e sidebar preservam seleção, teclado e foco', async ({ page }, testInfo) => {
  const panel = await filters(page)
  await panel.getByLabel('Kurio Studio', { exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(panel.getByLabel('Kurio Studio', { exact: true })).toBeChecked()
  await panel.getByLabel('Preço mínimo em ETH').fill('1.2')
  if ((page.viewportSize()?.width ?? 1440) <= 600) {
    const dialog = page.getByRole('dialog', { name: 'Filtros de NFTs' })
    await dialog.getByRole('button', { name: 'Ver resultados', exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Fechar filtros', exact: true })).toBeFocused()
    const focusBottom = await dialog.getByRole('button', { name: 'Fechar filtros', exact: true }).evaluate((element) => { const style = getComputedStyle(element); return element.getBoundingClientRect().bottom + parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset) })
    const clearBox = await panel.getByRole('button', { name: 'Limpar tudo', exact: true }).boundingBox()
    expect(focusBottom).toBeLessThanOrEqual(clearBox!.y)
    await testInfo.attach('drawer-filtros', { body: await page.screenshot(), contentType: 'image/png' })
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir filtros' })).toBeFocused()
    const reopened = await filters(page)
    await expect(reopened.getByLabel('Kurio Studio', { exact: true })).toBeChecked()
    await expect(reopened.getByLabel('Preço mínimo em ETH')).toHaveValue('1.2')
  }
  const applied = await filters(page)
  await applied.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await closeFilters(page)
  await count(page, 2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }) })
  await testInfo.attach('catalogo-filtrado', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
})

test('Socket.IO reconcilia filtro, estoque, preço, total e ordem da REST', async ({ page }) => {
  await page.goto('/?q=Emerald&maxPrice=1.2&availability=available&sort=price-asc')
  await count(page, 3)
  await control(page, 'scenario', { scenario: 'slow' })
  const event = await control(page, 'nfts/emerald-ape-042/update', { priceEth: '1.49' }) as NftUpdated
  await expect(page.locator('.refresh-status')).toHaveText('Atualizando coleção…')
  await count(page, 2)
  await expect(page.getByTestId('nft-emerald-ape-042')).toHaveCount(0)
  const received = await page.getByTestId('live-event').getAttribute('data-received')
  await control(page, 'events/replay', event)
  await expect(page.getByTestId('live-event')).toHaveAttribute('data-received', received!)
  await control(page, 'scenario', { scenario: 'success' })
  await control(page, 'nfts/emerald-ape-042-edition-1/update', { editionId: 'standard', available: 0 })
  await control(page, 'nfts/emerald-ape-042-edition-1/update', { editionId: 'limited', available: 0 })
  await control(page, 'nfts/emerald-ape-042-edition-1/update', { editionId: 'unique', available: 0 })
  await count(page, 1)
  const rest = await read(page, new URL(page.url()).searchParams.toString())
  expect(rest.total).toBe(1)
  expect(rest.items.map((item) => item.id)).toEqual(await ids(page))
})
