import { delay, http, HttpResponse } from 'msw'
import type { ProfileUpdate } from '@/api/contracts'
import { authStore } from './auth-store'
import { CartError } from './cart-store'
import { commerceTransaction } from './commerce-db'
import { getAuthScenario } from './auth-scenarios'

const base = import.meta.env.VITE_API_BASE_URL || '/api'
export const profileHandlers = (['get', 'put'] as const).map((method) => http[method](`${base}/users/:userId/profile`, async ({ request, params }) => {
  try {
    const authorize = () => {
      const session = authStore.authorize(request)
      if (!session || request.signal.aborted) throw new CartError(401, 'UNAUTHORIZED', 'Sua sessão expirou. Entre novamente.')
      if (session.user.id !== params.userId) throw new CartError(403, 'FORBIDDEN', 'Este perfil pertence a outro usuário.')
      return session
    }
    authorize()
    await delay(method === 'get' ? getAuthScenario().privateDelay : getAuthScenario().mutationDelay)
    return await commerceTransaction(async () => {
      const session = authorize()
      if (getAuthScenario().accountFailure) throw new CartError(503, 'ACCOUNT_UNAVAILABLE', 'Não foi possível acessar sua conta. Tente novamente.')
      return HttpResponse.json(method === 'get' ? authStore.profile(session) : await authStore.updateProfile(request, session, await request.json() as ProfileUpdate))
    })
  } catch (error) {
    return error instanceof CartError ? HttpResponse.json(error.body(), { status: error.status }) : HttpResponse.json({ code: 'INVALID_INPUT', message: 'Dados inválidos.' }, { status: 422 })
  }
}))
