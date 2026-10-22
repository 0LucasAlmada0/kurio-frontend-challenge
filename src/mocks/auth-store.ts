import type { Profile, ProfileUpdate, Session, User } from '@/api/contracts'
import { validateProfile } from '@/features/profile/validation'
import { CartError } from './cart-store'

interface StoredUser extends User { salt: string; passwordHash: string; profile?: Profile }
interface AuthData { users: StoredUser[]; sessions: Record<string, Session>; favorites: Record<string, string[]> }
const key = 'kurio:mock-auth:v1'
const seeds: StoredUser[] = []
let data: AuthData

function fresh(): AuthData { return { users: structuredClone(seeds), sessions: {}, favorites: {} } }
function read(): AuthData {
  try { const saved = JSON.parse(localStorage.getItem(key) || 'null') as AuthData | null; if (saved && Array.isArray(saved.users) && saved.sessions && saved.favorites) return saved } catch { /* Storage fallback. */ }
  return typeof data === 'undefined' ? fresh() : data
}
function persist() { try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* In-memory mock remains usable. */ } }
function hex(buffer: ArrayBuffer) { return Array.from(new Uint8Array(buffer), (value) => value.toString(16).padStart(2, '0')).join('') }
export async function passwordHash(password: string, salt: string) {
  const secret = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 600_000 }, secret, 256))
}
function publicUser({ id, name, email }: StoredUser): User { return { id, name, email } }
function profile(user: StoredUser): Profile {
  return user.profile ?? { userId: user.id, version: 1, displayName: user.name, username: `${user.name.toLowerCase().replace(/[^\p{L}\d_.-]/gu, '').slice(0, 50)}${user.id.startsWith('user-') ? '' : `-${user.id.slice(0, 6)}`}`, email: user.email, ens: '', walletAlias: '', avatar: null }
}

export const authStore = {
  init: (users: StoredUser[]) => { seeds.push(...users); data = read() },
  reset: () => { data = fresh(); persist() },
  findEmail: (email: string) => { data = read(); return data.users.find((user) => user.email === email.toLowerCase().trim()) },
  register: async (name: string, email: string, password: string) => {
    const salt = crypto.randomUUID()
    const hash = await passwordHash(password, salt)
    if (authStore.findEmail(email)) return undefined
    const user: StoredUser = { id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), salt, passwordHash: hash }
    data.users.push(user)
    persist()
    return user
  },
  createSession: (user: StoredUser) => {
    data = read()
    const session: Session = { id: crypto.randomUUID(), token: crypto.randomUUID(), user: publicUser(user), expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() }
    data.sessions[session.token] = session
    persist()
    return structuredClone(session)
  },
  authorize: (request: Request) => {
    data = read()
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') || ''
    const session = data.sessions[token]
    return session && Date.parse(session.expiresAt) > Date.now() ? structuredClone(session) : undefined
  },
  revoke: (request: Request) => { data = read(); const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') || ''; delete data.sessions[token]; persist() },
  expire: () => { data = read(); for (const session of Object.values(data.sessions)) session.expiresAt = new Date(0).toISOString(); persist() },
  profile: (session: Session) => {
    data = read()
    const user = data.users.find((item) => item.id === session.user.id)
    if (!user) throw new CartError(401, 'UNAUTHORIZED', 'Entre novamente.')
    return structuredClone(profile(user))
  },
  updateProfile: async (request: Request, session: Session, input: ProfileUpdate) => {
    const fields = validateProfile(input)
    if (Object.keys(fields).length) throw new CartError(422, 'VALIDATION', 'Revise os campos indicados.', fields)
    data = read()
    const previous = data.users.find((user) => user.id === session.user.id)!
    const originalHash = previous.passwordHash
    let salt = previous.salt
    let hash = originalHash
    if (input.password) {
      if (await passwordHash(input.password.currentPassword, previous.salt) !== originalHash) throw new CartError(422, 'PASSWORD_INVALID', 'A senha atual está incorreta.', { currentPassword: 'A senha atual está incorreta.' })
      salt = crypto.randomUUID()
      hash = await passwordHash(input.password.newPassword, salt)
    }
    if (input.avatar && input.avatar !== profile(previous).avatar) {
      try {
        const binary = atob(input.avatar.split(',')[1]!)
        const image = await createImageBitmap(new Blob([Uint8Array.from(binary, (value) => value.charCodeAt(0))]))
        image.close()
      } catch { throw new CartError(422, 'VALIDATION', 'Não foi possível ler a imagem.', { avatar: 'A imagem está corrompida ou não é compatível.' }) }
    }
    if (!authStore.authorize(request) || request.signal.aborted) throw new CartError(401, 'UNAUTHORIZED', 'Sua sessão expirou. Entre novamente.')
    const before = structuredClone(read())
    data = structuredClone(before)
    const user = data.users.find((item) => item.id === session.user.id)!
    if (profile(user).version !== input.version || user.passwordHash !== originalHash) throw new CartError(409, 'PROFILE_STALE', 'O perfil mudou. Recarregue os dados antes de salvar.')
    const email = input.email.trim().toLowerCase()
    const username = input.username.trim()
    if (data.users.some((item) => item.id !== user.id && item.email === email)) throw new CartError(409, 'EMAIL_CONFLICT', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' })
    if (data.users.some((item) => item.id !== user.id && profile(item).username.toLowerCase() === username.toLowerCase())) throw new CartError(409, 'USERNAME_CONFLICT', 'Este nome de usuário já está em uso.', { username: 'Este nome de usuário já está em uso.' })
    user.profile = { userId: user.id, version: input.version + 1, displayName: input.displayName.trim(), username, email, ens: input.ens.trim().toLowerCase(), walletAlias: input.walletAlias.trim(), avatar: input.avatar }
    user.name = user.profile.displayName; user.email = email; user.salt = salt; user.passwordHash = hash
    for (const stored of Object.values(data.sessions)) if (stored.user.id === user.id) stored.user = publicUser(user)
    // Fail rather than acknowledge an avatar/profile that cannot survive refresh.
    try { localStorage.setItem(key, JSON.stringify(data)) } catch { data = before; throw new CartError(503, 'STORAGE_FULL', 'Não foi possível persistir. Libere espaço ou use uma imagem menor.') }
    return structuredClone(user.profile)
  },
  favorites: (session: Session) => ({ userId: session.user.id, sessionId: session.id, nftIds: [...(data.favorites[session.user.id] ?? [])] }),
  favorite: (session: Session, nftId: string, add: boolean) => {
    const ids = new Set(data.favorites[session.user.id] ?? [])
    if (add) ids.add(nftId); else ids.delete(nftId)
    data.favorites[session.user.id] = [...ids]
    persist()
    return authStore.favorites(session)
  },
}
