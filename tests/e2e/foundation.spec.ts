import { test, expect, type Page } from '@playwright/test'
import type { Nft, NftUpdated } from '../../src/api/contracts'

async function post(page: Page, path: string, body: unknown = {}) {
  return page.evaluate(async ({ path, body }) => {
    const response = await fetch(`/api/__mock/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`Mock control failed: ${response.status}`)
    return response.json() as Promise<unknown>
  }, { path, body })
}

async function readNft(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/nfts/emerald-ape-042')
    if (!response.ok) throw new Error(`REST failed: ${response.status}`)
    return response.json() as Promise<Nft>
  })
}

async function searchFor(page: Page, value: string) {
  const input = page.getByLabel('Buscar NFTs')
  if (!await input.isVisible()) await page.getByRole('link', { name: 'Ir para busca de NFTs' }).click()
  await input.fill(value)
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => console.error('Browser error:', error.message))
  await page.goto('/')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await post(page, 'reset')
  await page.reload()
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
})

test('catálogo: REST, assets locais e navegação ao detalhe', async ({ page }) => {
  const card = page.getByTestId('nft-emerald-ape-042')
  await expect(page.getByRole('article')).toHaveCount(8)
  await expect(card.getByTestId('price')).toHaveText('1.19 ETH')
  const restResponse = page.waitForResponse((response) => response.url().endsWith('/api/nfts/emerald-ape-042'))
  const apiNft = await readNft(page)
  expect((await restResponse).fromServiceWorker()).toBe(true)
  expect(apiNft.version).toBe(1)
  await expect(card.getByRole('img')).toHaveAttribute('src', apiNft.image)
  expect(await card.getByRole('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  if ((page.viewportSize()?.width ?? 1440) > 600) await expect(page.locator('.catalog-layout > .catalog-sidebar').getByLabel('Kurio Apes', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('catalog.png', { fullPage: true })
  await card.getByRole('link').click()
  await expect(page).toHaveURL(/\/nfts\/emerald-ape-042/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(apiNft.name)
  const detail = page.getByTestId(`detail-${apiNft.id}`)
  await expect(detail.getByTestId('price')).toHaveText(`${apiNft.priceEth} ETH`)
  await expect(detail.getByRole('button', { name: 'Adicionar ao carrinho', exact: true })).toBeEnabled()
  await expect(detail.getByRole('button', { name: `Aumentar quantidade de ${apiNft.name}` })).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.reload()
  await expect(detail.getByTestId('price')).toHaveText('1.19 ETH')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await expect(page).toHaveScreenshot('detail.png', { fullPage: true })
})

test('Socket.IO: evento real, REST coerente, duplicatas e reconexão', async ({ page }) => {
  const card = page.getByTestId('nft-emerald-ape-042')
  await expect(card.getByTestId('price')).toHaveText('1.19 ETH')
  await page.getByText('Cenários de demonstração', { exact: true }).click()
  const change = page.waitForResponse((response) => response.url().endsWith('/__mock/nfts/emerald-ape-042/update') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Alterar Emerald Ape' }).click()
  const event = await (await change).json() as NftUpdated
  await expect(page.getByTestId('live-event')).toHaveAttribute('data-received', '1')
  await expect(page.getByTestId('live-event')).toContainText('1.49 ETH')
  await expect(card.getByTestId('price')).toHaveText('1.49 ETH')
  expect(event.version).toBe(2)
  expect(await readNft(page)).toEqual(event.resource)
  await post(page, 'events/replay', event)
  await post(page, 'events/replay', { ...event, version: 1, resource: { ...event.resource, version: 1, priceEth: '0.01' } })
  await post(page, 'events/replay', { ...event, version: 9, resourceId: 'wrong-id' })
  await expect(page.getByTestId('live-event')).toHaveAttribute('data-received', '1')
  await card.getByRole('link').click()
  const detailPrice = page.getByTestId('detail-emerald-ape-042').getByTestId('price')
  await expect(detailPrice).toHaveText('1.49 ETH')
  await post(page, 'nfts/emerald-ape-042/update')
  await expect(detailPrice).toHaveText('1.19 ETH')
  await expect(page.getByTestId('live-event')).toHaveAttribute('data-received', '2')
  await page.clock.install()
  await post(page, 'disconnect')
  await expect(page.getByTestId('socket-status')).toHaveText('○ Reconectando')
  const missed = await post(page, 'nfts/emerald-ape-042/update') as NftUpdated
  await page.clock.runFor(2_000)
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await expect(detailPrice).toHaveText('1.49 ETH')
  expect(await readNft(page)).toEqual(missed.resource)
  await page.clock.runFor(35_000)
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await page.reload()
  await expect(detailPrice).toHaveText('1.49 ETH')
})

test('busca e paginação na URL, histórico e recurso inexistente', async ({ page }) => {
  await searchFor(page, 'Emerald')
  await expect(page).toHaveURL(/q=Emerald/)
  await expect(page.getByRole('article')).toHaveCount(3)
  await page.reload()
  await expect(page.getByLabel('Buscar NFTs')).toHaveValue('Emerald')
  await expect(page.getByRole('article')).toHaveCount(3)
  await searchFor(page, '')
  await expect(page.getByRole('article')).toHaveCount(8)
  await page.getByRole('button', { name: 'Próxima' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('article')).toHaveCount(4)
  await page.goBack()
  await expect(page.getByRole('article')).toHaveCount(8)
  await page.goto('/nfts/inexistente')
  await expect(page.getByRole('alert')).toContainText('NFT não encontrado')
})

test('cenários: vazio, erro, recuperação e skeleton com reduced motion', async ({ page }) => {
  await page.getByText('Cenários de demonstração', { exact: true }).click()
  await page.getByLabel('Resposta da API').selectOption('empty')
  await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  await expect(page.getByLabel('Resposta da API')).toBeEnabled()
  await page.getByLabel('Resposta da API').selectOption('error')
  await expect(page.getByRole('alert')).toContainText('indisponível')
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(page.getByLabel('Resposta da API')).toBeEnabled()
  await page.getByLabel('Resposta da API').selectOption('slow')
  await expect(page.getByRole('article')).toHaveCount(8)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await searchFor(page, 'Violet')
  const loading = page.getByRole('status', { name: 'Carregando NFTs' })
  await expect(loading).toBeVisible()
  expect(await loading.locator('[data-slot="skeleton"]').first().evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  await expect(page.getByRole('article')).toHaveCount(3)
})
