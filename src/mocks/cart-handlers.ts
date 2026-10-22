import { delay, http, HttpResponse } from 'msw'
import type { Cart, CartItemInput, Quote } from '@/api/contracts'
import { authStore } from './auth-store'
import { cartStore, CartError } from './cart-store'

const base = import.meta.env.VITE_API_BASE_URL || '/api'
type Scenario = { failure: 'none' | 'network' | 'server'; delay: number }
const scenarioKey = 'kurio:cart-scenario'
function restoreScenario(): Scenario {
  try { return JSON.parse(sessionStorage.getItem(scenarioKey) || 'null') as Scenario || { failure: 'none', delay: 150 } } catch { return { failure: 'none', delay: 150 } }
}
let scenario = restoreScenario()
export const getCartScenario = () => scenario
export function resetCartMocks() { cartStore.reset(); scenario = { failure: 'none', delay: 150 }; try { sessionStorage.removeItem(scenarioKey) } catch { /* Memory-only fallback. */ } }
function owner(request: Request): string {
  if (request.headers.has('Authorization')) {
    const session = authStore.authorize(request)
    if (!session) throw new CartError(401, 'UNAUTHORIZED', 'Sua sessão expirou. Entre novamente.')
    return session.user.id
  }
  const guestId = request.headers.get('X-Guest-Cart')
  if (!guestId || !/^guest:[\da-f-]{36}$/i.test(guestId)) throw new CartError(401, 'GUEST_REQUIRED', 'Identificação do carrinho visitante ausente.')
  return guestId
}
async function handle<T extends Cart | Quote>(request: Request, action: (ownerId: string) => T | Promise<T>) {
  try {
    owner(request)
    await delay(scenario.delay)
    if (request.signal.aborted) return HttpResponse.error()
    if (scenario.failure === 'network') return HttpResponse.error()
    if (scenario.failure === 'server') throw new CartError(503, 'CART_UNAVAILABLE', 'Carrinho indisponível. Seus itens foram preservados. Tente novamente.')
    const result = await action(owner(request))
    owner(request)
    return HttpResponse.json(result)
  } catch (error) {
    if (error instanceof CartError) return HttpResponse.json(error.body(), { status: error.status })
    return HttpResponse.json({ code: 'INVALID_INPUT', message: 'Dados do carrinho inválidos.' }, { status: 422 })
  }
}
export const cartHandlers = [
  http.get(`${base}/cart`, ({ request }) => handle(request, (id) => cartStore.get(id))),
  http.put(`${base}/cart/items`, async ({ request }) => {
    const input = await request.json() as CartItemInput
    return handle(request, (id) => {
      if (!input || typeof input.nftId !== 'string' || typeof input.editionId !== 'string' || !['add', 'set'].includes(input.operation ?? 'set')) throw new CartError(422, 'INVALID_INPUT', 'Item inválido.')
      return cartStore.change(id, input)
    })
  }),
  http.delete(`${base}/cart/items/:nftId/:editionId`, ({ request, params }) => handle(request, (id) => cartStore.remove(id, String(params.nftId), String(params.editionId)))),
  http.put(`${base}/cart/coupon`, async ({ request }) => {
    const input = await request.json() as { code?: unknown }
    return handle(request, (id) => {
      if (typeof input?.code !== 'string') throw new CartError(422, 'INVALID_INPUT', 'Informe o código promocional.')
      return cartStore.coupon(id, input.code)
    })
  }),
  http.delete(`${base}/cart/coupon`, ({ request }) => handle(request, (id) => cartStore.coupon(id, null))),
  http.get(`${base}/cart/quote`, ({ request }) => handle(request, (id) => cartStore.quote(id))),
  http.post(`${base}/cart/quote/validate`, async ({ request }) => {
    const input = await request.json() as { id?: string }
    return handle(request, async (id) => {
      const quote = await cartStore.quote(id)
      if (input?.id !== quote.id || !quote.valid) throw new CartError(409, 'QUOTE_STALE', 'Cotação desatualizada ou indisponível. Solicite uma nova cotação.')
      return quote
    })
  }),
  http.post(`${base}/__mock/cart/scenario`, async ({ request }) => {
    const input = await request.json() as Partial<Scenario>
    if (input.failure && ['none', 'network', 'server'].includes(input.failure)) scenario.failure = input.failure
    if (Number.isSafeInteger(input.delay) && input.delay! >= 0 && input.delay! <= 9_000) scenario.delay = input.delay!
    try { sessionStorage.setItem(scenarioKey, JSON.stringify(scenario)) } catch { /* Memory-only fallback. */ }
    return HttpResponse.json(scenario)
  }),
]
