import { delay, http, HttpResponse } from 'msw'
import { ethToWei } from '@/lib/eth'
import { store } from './store'
import { disconnectClients, emitNftUpdated, socketHandler } from './socket'
import { getScenario, latency, setScenario } from './scenarios'
import { authHandlers, resetAuthMocks } from './auth-handlers'
import { cartHandlers, resetCartMocks } from './cart-handlers'
import { checkoutHandlers, resetCheckoutMocks } from './checkout-handlers'
import { commerceTransaction } from './commerce-db'
import { profileHandlers } from './profile-handlers'
import { normalizeCatalogSearch, selections } from '@/features/catalog/search'

const base = import.meta.env.VITE_API_BASE_URL || '/api'
export const handlers = [
  ...authHandlers,
  ...profileHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  http.get(`${base}/nfts/filters`, async () => {
    await delay(120)
    if (getScenario() === 'error') return HttpResponse.json({ code: 'UNAVAILABLE', message: 'Filtros indisponíveis.' }, { status: 503 })
    const items = store.list()
    return HttpResponse.json({ collections: [...new Set(items.map((nft) => nft.collection))].sort(), rarities: [...new Set(items.map((nft) => nft.rarity))].sort() })
  }),
  http.get(`${base}/nfts`, async ({ request }) => {
    const params = new URL(request.url).searchParams
    const search = normalizeCatalogSearch(Object.fromEntries(params))
    const q = search.q.toLowerCase()
    await delay(latency(q))
    if (getScenario() === 'offline') return HttpResponse.error()
    if (getScenario() === 'error') return HttpResponse.json({ code: 'UNAVAILABLE', message: 'O catálogo está indisponível. Tente novamente.' }, { status: 503 })
    const { page, sort } = search
    const collections = selections(search.collections)
    const rarities = selections(search.rarities)
    const items = getScenario() === 'empty' ? [] : store.list().filter((nft) => `${nft.name} ${nft.collection}`.toLowerCase().includes(q)
      && (!collections.length || collections.includes(nft.collection)) && (!rarities.length || rarities.includes(nft.rarity))
      && (!search.minPrice || ethToWei(nft.priceEth) >= ethToWei(search.minPrice)) && (!search.maxPrice || ethToWei(nft.priceEth) <= ethToWei(search.maxPrice))
      && (!search.availability || (search.availability === 'available' ? nft.available > 0 : nft.available === 0)))
    if (sort === 'price-asc' || sort === 'price-desc') items.sort((a, b) => {
      const delta = ethToWei(a.priceEth) - ethToWei(b.priceEth)
      return delta === 0n ? a.id.localeCompare(b.id) : (delta > 0n ? 1 : -1) * (sort === 'price-desc' ? -1 : 1)
    })
    if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR') || a.id.localeCompare(b.id, 'en'))
    const pageSize = 8
    return HttpResponse.json({ items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize })
  }),
  http.get(`${base}/nfts/:id`, async ({ params }) => {
    await delay(latency(''))
    if (getScenario() === 'offline') return HttpResponse.error()
    if (getScenario() === 'error') return HttpResponse.json({ code: 'UNAVAILABLE', message: 'O NFT está indisponível. Tente novamente.' }, { status: 503 })
    const nft = store.get(String(params.id))
    return nft ? HttpResponse.json(nft) : HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado.' }, { status: 404 })
  }),
  http.post(`${base}/__mock/reset`, () => commerceTransaction(() => {
    resetCheckoutMocks()
    resetAuthMocks()
    resetCartMocks()
    setScenario('success')
    return HttpResponse.json({ ok: true })
  })),
  http.post(`${base}/__mock/scenario`, async ({ request }) => {
    const body = await request.json() as { scenario?: unknown }
    return setScenario(body.scenario) ? HttpResponse.json({ ok: true }) : HttpResponse.json({ code: 'INVALID_SCENARIO' }, { status: 400 })
  }),
  http.post(`${base}/__mock/nfts/:id/update`, async ({ params, request }) => {
    const change = await request.json().catch(() => ({})) as { priceEth?: string; editionId?: string; available?: number }
    if ((change.priceEth !== undefined && !/^\d+\.\d{1,18}$/.test(change.priceEth)) || (change.available !== undefined && (!Number.isSafeInteger(change.available) || change.available < 0))) return HttpResponse.json({ code: 'INVALID_INPUT' }, { status: 422 })
    return commerceTransaction(() => {
      const event = store.update(String(params.id), change as Parameters<typeof store.update>[1])
      if (!event) return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
      emitNftUpdated(event)
      return HttpResponse.json(event)
    })
  }),
  http.post(`${base}/__mock/events/replay`, async ({ request }) => {
    const event = await request.json()
    emitNftUpdated(event as Parameters<typeof emitNftUpdated>[0])
    return HttpResponse.json({ ok: true })
  }),
  http.post(`${base}/__mock/disconnect`, () => {
    disconnectClients()
    return HttpResponse.json({ ok: true })
  }),
  socketHandler,
]
