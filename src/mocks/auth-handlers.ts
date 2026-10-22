import { delay, http, HttpResponse } from 'msw'
import type { LoginInput, RegisterInput } from '@/api/contracts'
import { validateCredentials } from '@/features/auth/validation'
import { userFixtures } from './fixtures'
import { authStore, passwordHash } from './auth-store'
import { store } from './store'
import { getAuthScenario, resetAuthScenario, setAuthScenario } from './auth-scenarios'
import { cartStore } from './cart-store'

const base = import.meta.env.VITE_API_BASE_URL || '/api'
authStore.init(userFixtures)
const unauthorized = () => HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Sua sessão expirou. Entre novamente.' }, { status: 401 })
const forbidden = () => HttpResponse.json({ code: 'FORBIDDEN', message: 'Você não tem acesso aos dados deste usuário.' }, { status: 403 })
const inFlight = new Set<Promise<void>>()
async function privateDelay(ms: number) {
  const pending = delay(ms)
  inFlight.add(pending)
  try { await pending } finally { inFlight.delete(pending) }
}

function credentials(body: unknown, registration: boolean): LoginInput | RegisterInput | undefined {
  if (!body || typeof body !== 'object') return
  const value = body as Partial<RegisterInput>
  if (typeof value.email !== 'string' || typeof value.password !== 'string') return
  if (registration && (typeof value.name !== 'string' || typeof value.confirmPassword !== 'string')) return
  return registration ? { name: value.name!, email: value.email.trim(), password: value.password, confirmPassword: value.confirmPassword! } : { email: value.email.trim(), password: value.password }
}

export function resetAuthMocks() { authStore.reset(); resetAuthScenario() }

export const authHandlers = [
  http.post(`${base}/users`, async ({ request }) => {
    await delay(120)
    if (getAuthScenario().authFailure) return HttpResponse.json({ code: 'UNAVAILABLE', message: 'Autenticação indisponível. Tente novamente.' }, { status: 503 })
    const input = credentials(await request.json(), true) as RegisterInput | undefined
    const fields = input ? validateCredentials(input) : { email: 'Dados de cadastro inválidos.' }
    if (!input || Object.keys(fields).length) return HttpResponse.json({ code: 'VALIDATION', message: 'Revise os campos indicados.', fields }, { status: 422 })
    if (authStore.findEmail(input.email)) return HttpResponse.json({ code: 'EMAIL_CONFLICT', message: 'Este e-mail já está cadastrado.', fields: { email: 'Este e-mail já está cadastrado.' } }, { status: 409 })
    const user = await authStore.register(input.name, input.email, input.password)
    if (!user) return HttpResponse.json({ code: 'EMAIL_CONFLICT', message: 'Este e-mail já está cadastrado.' }, { status: 409 })
    authStore.revoke(request)
    cartStore.merge(request.headers.get('X-Guest-Cart'), user.id)
    return HttpResponse.json(authStore.createSession(user), { status: 201 })
  }),
  http.post(`${base}/session`, async ({ request }) => {
    await delay(120)
    if (getAuthScenario().authFailure) return HttpResponse.json({ code: 'UNAVAILABLE', message: 'Autenticação indisponível. Tente novamente.' }, { status: 503 })
    const input = credentials(await request.json(), false)
    const fields = input ? validateCredentials(input) : { email: 'Dados de login inválidos.' }
    if (!input || Object.keys(fields).length) return HttpResponse.json({ code: 'VALIDATION', message: 'Revise os campos indicados.', fields }, { status: 422 })
    const user = authStore.findEmail(input.email)
    if (!user || await passwordHash(input.password, user.salt) !== user.passwordHash) return HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' }, { status: 401 })
    authStore.revoke(request)
    cartStore.merge(request.headers.get('X-Guest-Cart'), user.id)
    return HttpResponse.json(authStore.createSession(user))
  }),
  http.get(`${base}/session`, async ({ request }) => {
    await delay(120)
    if (getAuthScenario().authFailure) return HttpResponse.json({ code: 'UNAVAILABLE', message: 'Não foi possível recuperar sua sessão.' }, { status: 503 })
    const session = authStore.authorize(request)
    return session ? HttpResponse.json(session) : unauthorized()
  }),
  http.delete(`${base}/session`, ({ request }) => { authStore.revoke(request); return new HttpResponse(null, { status: 204 }) }),
  http.get(`${base}/users/:userId/favorites`, async ({ request, params }) => {
    const session = authStore.authorize(request)
    if (!session) return unauthorized()
    if (session.user.id !== params.userId) return forbidden()
    await privateDelay(getAuthScenario().privateDelay)
    if (!authStore.authorize(request)) return unauthorized()
    return HttpResponse.json(authStore.favorites(session))
  }),
  ...(['put', 'delete'] as const).map((method) => http[method](`${base}/users/:userId/favorites/:nftId`, async ({ request, params }) => {
    const session = authStore.authorize(request)
    if (!session) return unauthorized()
    if (session.user.id !== params.userId) return forbidden()
    await privateDelay(getAuthScenario().mutationDelay)
    if (!authStore.authorize(request)) return unauthorized()
    if (!store.get(String(params.nftId))) return HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado.' }, { status: 404 })
    if (getAuthScenario().favoritesFailure) return HttpResponse.json({ code: 'FAVORITE_REFUSED', message: 'Não foi possível alterar o favorito. Tente novamente.' }, { status: 503 })
    return HttpResponse.json(authStore.favorite(session, String(params.nftId), method === 'put'))
  })),
  http.post(`${base}/__mock/auth/scenario`, async ({ request }) => {
    setAuthScenario(await request.json() as Parameters<typeof setAuthScenario>[0])
    return HttpResponse.json(getAuthScenario())
  }),
  http.post(`${base}/__mock/auth/expire`, () => { authStore.expire(); return HttpResponse.json({ ok: true }) }),
  http.post(`${base}/__mock/auth/idle`, async () => { await Promise.all([...inFlight]); return HttpResponse.json({ ok: true }) }),
]
