import { delay, http, HttpResponse } from 'msw'
import type { OrderInput, OrderUpdated, Session, WalletInput, WalletProvider } from '@/api/contracts'
import { authStore } from './auth-store'
import { commerceTransaction, readCommerce, resetCommerce, writeCommerce } from './commerce-db'
import { CartError } from './cart-store'
import { checkoutScenario, resetCheckoutScenario, setCheckoutScenario } from './checkout-scenarios'
import { orderStore, resetOrderTimers, settleOrders } from './order-store'
import { disconnectClients, emitNftUpdated, replayOrderUpdated } from './socket'
import { store } from './store'

const base = import.meta.env.VITE_API_BASE_URL || '/api'
function authorize(request: Request): Session {
  const session = authStore.authorize(request)
  if (!session) throw new CartError(401, 'UNAUTHORIZED', 'Sua sessão expirou. Entre novamente para retomar o checkout.')
  return session
}
async function handle<T extends object>(request: Request, action: (session: Session) => T | Promise<T>) {
  try {
    authorize(request)
    await delay(120)
    return await commerceTransaction(async () => {
      const session = authorize(request)
      if (request.signal.aborted) return HttpResponse.error()
      settleOrders()
      const result = await action(session)
      authorize(request)
      return HttpResponse.json(result)
    })
  } catch (error) {
    if (error instanceof CartError) return HttpResponse.json(error.body(), { status: error.status })
    return HttpResponse.json({ code: 'INVALID_INPUT', message: 'Dados inválidos. Revise os campos.' }, { status: 422 })
  }
}
export function resetCheckoutMocks() {
  resetOrderTimers(); resetCommerce(); resetCheckoutScenario()
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => !!key && /^kurio:(attempt|collector):/.test(key))
    for (const key of keys) localStorage.removeItem(key)
  } catch { /* UI reset also reloads the in-memory client state. */ }
}
export const checkoutHandlers = [
  http.get(`${base}/wallets`, ({ request }) => handle(request, (session) => orderStore.wallets(session))),
  http.post(`${base}/wallets`, ({ request }) => handle(request, async (session) => orderStore.addWallet(session, await request.json() as WalletInput))),
  http.post(`${base}/wallets/connection`, ({ request }) => handle(request, async (session) => {
    const input = await request.json() as { walletId: string; provider: WalletProvider }
    return orderStore.connect(session, input.walletId, input.provider)
  })),
  http.delete(`${base}/wallets/connection`, ({ request }) => handle(request, (session) => orderStore.disconnect(session))),
  http.get(`${base}/orders/by-key/:key`, ({ request, params }) => handle(request, (session) => orderStore.byKey(session, String(params.key)))),
  http.get(`${base}/orders/:id`, ({ request, params }) => handle(request, (session) => orderStore.get(session, String(params.id)))),
  http.get(`${base}/orders`, ({ request }) => handle(request, (session) => ({ userId: session.user.id, items: Object.values(readCommerce().orders).map((record) => record.order).filter((order) => order.userId === session.user.id) }))),
  http.post(`${base}/orders`, async ({ request }) => {
    let created = false
    const response = await handle(request, async (session) => {
      const input = await request.json() as OrderInput
      const scenario = checkoutScenario()
      if (scenario.beforeCreate !== 'none') {
        setCheckoutScenario({ beforeCreate: 'none' })
        const line = readCommerce().carts[session.user.id]?.items[0]
        if (scenario.beforeCreate === 'session-expired') { authStore.expire(); authorize(request) }
        else if (scenario.beforeCreate === 'expired') { const data = readCommerce(); data.quoteEpoch += 1; writeCommerce(data) }
        else if (line) {
          const event = store.update(line.nftId, scenario.beforeCreate === 'sold-out' ? { editionId: line.editionId, available: 0 } : { priceEth: '1.49' })
          if (event) emitNftUpdated(event)
        }
      }
      const key = request.headers.get('Idempotency-Key') ?? ''
      const before = Object.keys(readCommerce().orders).length
      const order = await orderStore.create(session, key, input, () => { authorize(request) })
      created = Object.keys(readCommerce().orders).length > before
      if (created && scenario.disconnectPending) disconnectClients()
      return order
    })
    // Simulate a lost acknowledgement after the authoritative commit, outside the lock.
    if (created && checkoutScenario().timeoutAfterCreate) { await delay(9000); return HttpResponse.error() }
    return response
  }),
  http.post(`${base}/__mock/checkout/scenario`, async ({ request }) => HttpResponse.json(setCheckoutScenario(await request.json() as Parameters<typeof setCheckoutScenario>[0]))),
  http.post(`${base}/__mock/checkout/resolve-pending`, async ({ request }) => {
    const input = await request.json() as { status?: string }
    if (!['confirmed', 'refused'].includes(input.status ?? '')) return HttpResponse.json({ code: 'INVALID_STATUS' }, { status: 422 })
    return commerceTransaction(() => {
      const orders = Object.values(readCommerce().orders).filter((record) => record.order.status === 'pending')
      for (const record of orders) orderStore.resolve(record.order.id, input.status as 'confirmed' | 'refused')
      return HttpResponse.json({ resolved: orders.length })
    })
  }),
  http.post(`${base}/__mock/orders/:id/resolve`, async ({ request, params }) => {
    const input = await request.json() as { status?: string }
    if (!['confirmed', 'refused'].includes(input.status ?? '')) return HttpResponse.json({ code: 'INVALID_STATUS' }, { status: 422 })
    return commerceTransaction(() => {
      try { return HttpResponse.json(orderStore.resolve(String(params.id), input.status as 'confirmed' | 'refused')) }
      catch (error) { return error instanceof CartError ? HttpResponse.json(error.body(), { status: error.status }) : HttpResponse.error() }
    })
  }),
  http.post(`${base}/__mock/orders/replay`, async ({ request }) => { replayOrderUpdated(await request.json() as OrderUpdated); return HttpResponse.json({ ok: true }) }),
]
