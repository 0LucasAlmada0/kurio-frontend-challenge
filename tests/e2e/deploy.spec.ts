import { test, expect } from '@playwright/test'

test('deploy: fallback HTTP das rotas e arquivos públicos sem service worker', async ({ request }) => {
  for (const path of ['/', '/nfts/emerald-ape-042', '/login?redirect=%2Fpagamento', '/cadastro', '/favoritos', '/carrinho', '/pagamento', '/pedidos/pedido-inexistente', '/rota-inexistente']) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    expect(response.headers()['content-type'], path).toContain('text/html')
    expect(await response.text(), path).toContain('<div id="root">')
  }
  const worker = await request.get('/mockServiceWorker.js')
  expect(worker.status()).toBe(200)
  expect(worker.headers()['content-type']).toMatch(/javascript/)
  expect(await worker.text()).toContain('INTEGRITY_CHECK_REQUEST')
  const html = await (await request.get('/')).text()
  const entry = html.match(/<script\b[^>]*type="module"[^>]*src="([^"]+)"/)?.[1]
  expect(entry).toBeTruthy()
  const script = await request.get(entry!)
  expect(script.status()).toBe(200)
  expect(script.headers()['content-type']).toMatch(/javascript/)
  const image = await request.get('/assets/nfts/emerald-ape.png')
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toContain('image/png')
})

test('deploy: acesso direto inicia MSW e Socket.IO na origem atual e sobrevive ao refresh', async ({ page }) => {
  const failures: string[] = []
  const sockets: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('websocket', (socket) => sockets.push(socket.url()))
  const rest = page.waitForResponse((response) => response.url().endsWith('/api/nfts/emerald-ape-042'))
  expect((await page.goto('/nfts/emerald-ape-042'))?.status()).toBe(200)
  expect((await rest).fromServiceWorker()).toBe(true)
  await expect(page.getByTestId('detail-emerald-ape-042')).toBeVisible()
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  const origin = new URL(page.url()).origin
  const registration = await page.evaluate(async () => {
    const worker = await navigator.serviceWorker.ready
    return { scope: worker.scope, script: worker.active?.scriptURL }
  })
  expect(registration).toEqual({ scope: `${origin}/`, script: `${origin}/mockServiceWorker.js` })
  const response = await page.evaluate(async () => {
    const result = await fetch('/api/__mock/nfts/emerald-ape-042/update', { method: 'POST' })
    return { status: result.status, event: await result.json() }
  })
  expect(response.status).toBe(200)
  await expect(page.getByTestId('live-event')).toHaveAttribute('data-received', '1')
  await expect(page.getByTestId('detail-emerald-ape-042').getByTestId('price')).toHaveText(`${response.event.resource.priceEth} ETH`)
  await page.reload()
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await expect(page.getByTestId('detail-emerald-ape-042').getByTestId('price')).toHaveText(`${response.event.resource.priceEth} ETH`)
  // MSW intercepta WebSocket no navegador; não abre um socket de rede real.
  expect(sockets).toEqual([])
  expect(failures).toEqual([])
})
