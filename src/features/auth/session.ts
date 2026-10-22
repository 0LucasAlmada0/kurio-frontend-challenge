import axios, { CanceledError, type AxiosRequestConfig } from 'axios'
import type { LoginInput, RegisterInput, Session, User } from '@/api/contracts'
import { http } from '@/api/http'
import { queryClient } from '@/app/query-client'
import { guestCart } from '@/features/cart/identity'

export type AuthState = { status: 'loading' | 'anonymous' | 'authenticated' | 'error'; session: Session | null; reason?: 'expired'; error?: unknown }
const tokenKey = 'kurio:session-token'
let state: AuthState = { status: 'loading', session: null }
const listeners = new Set<() => void>()
let controller = new AbortController()
let timer: ReturnType<typeof setTimeout> | undefined
let generation = 0
let initial: Promise<void> | undefined

function storedToken() { try { return localStorage.getItem(tokenKey) } catch { return null } }
function saveToken(token: string | null) {
  try { if (token) localStorage.setItem(tokenKey, token); else localStorage.removeItem(tokenKey) } catch { /* Memory-only session if storage is unavailable. */ }
}
function publish(next: AuthState) { state = next; for (const listener of listeners) listener() }
function clearPrivate() {
  controller.abort()
  controller = new AbortController()
  clearTimeout(timer)
  void queryClient.cancelQueries({ queryKey: ['private'] })
  queryClient.removeQueries({ queryKey: ['private'] })
  void queryClient.cancelQueries({ queryKey: ['visitor'] })
  queryClient.removeQueries({ queryKey: ['visitor'] })
  for (const mutation of queryClient.getMutationCache().getAll()) {
    if (['private', 'visitor'].includes(String(mutation.options.mutationKey?.[0]))) queryClient.getMutationCache().remove(mutation)
  }
}
function transition(session: Session | null, reason?: 'expired') {
  if (session || state.session) guestCart.rotate()
  generation += 1
  clearPrivate()
  saveToken(session?.token ?? null)
  publish({ status: session ? 'authenticated' : 'anonymous', session, reason })
  if (session) timer = setTimeout(() => auth.expire(), Math.max(0, Date.parse(session.expiresAt) - Date.now()))
}

export const auth = {
  subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
  getSnapshot: () => state,
  isCurrent: (session: Session) => state.session?.id === session.id && state.session.token === session.token,
  ready: () => { initial ??= auth.restore(); return initial },
  restore: async () => {
    const token = state.session?.token || storedToken()
    const requestGeneration = generation
    if (!token) { if (state.status === 'loading') transition(null); return }
    try {
      const response = await http.get<Session>('/session', { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } })
      if (requestGeneration === generation && state.session?.id !== response.data.id) transition(response.data)
      else if (requestGeneration === generation) auth.updateUser(response.data, response.data.user)
    } catch (error) {
      if (requestGeneration !== generation) return
      if (axios.isAxiosError(error) && error.response?.status === 401) transition(null, 'expired')
      else { generation += 1; clearPrivate(); publish({ status: 'error', session: null, error }) }
    }
  },
  authenticate: async (mode: 'login' | 'register', input: LoginInput | RegisterInput, signal?: AbortSignal) => {
    const requestGeneration = ++generation
    const previousToken = state.session?.token ?? storedToken()
    const response = await http.post<Session>(mode === 'login' ? '/session' : '/users', input, { signal, headers: { 'X-Guest-Cart': guestCart.id(), ...(previousToken ? { Authorization: `Bearer ${previousToken}` } : {}) } })
    if (requestGeneration !== generation) throw new CanceledError('Tentativa de autenticação obsoleta.')
    transition(response.data)
  },
  logout: async () => {
    const token = state.session?.token ?? storedToken()
    transition(null)
    if (token) await http.delete('/session', { headers: { Authorization: `Bearer ${token}` } })
  },
  expire: () => transition(null, 'expired'),
  updateUser: (session: Session, user: User) => {
    if (auth.isCurrent(session) && JSON.stringify(state.session!.user) !== JSON.stringify(user)) publish({ ...state, session: { ...state.session!, user } })
  },
  dismissExpiry: () => { if (state.reason) publish({ ...state, reason: undefined }) },
  syncStorage: () => {
    if (storedToken() === (state.session?.token ?? null)) return
    generation += 1
    clearPrivate()
    publish({ status: 'loading', session: null })
    void auth.restore()
  },
  request: async <T>(session: Session, config: AxiosRequestConfig): Promise<T> => {
    if (!auth.isCurrent(session)) throw new CanceledError('Sessão anterior.')
    const signal = AbortSignal.any([controller.signal, ...(config.signal ? [config.signal as AbortSignal] : [])])
    try {
      const response = await http.request<T>({ ...config, signal, headers: { ...config.headers, Authorization: `Bearer ${session.token}` } })
      if (!auth.isCurrent(session)) throw new CanceledError('Resposta de uma sessão anterior.')
      return response.data
    } catch (error) {
      if (auth.isCurrent(session) && axios.isAxiosError(error) && error.response?.status === 401) auth.expire()
      throw error
    }
  },
}
