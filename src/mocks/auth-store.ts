import type { Session, User } from '@/api/contracts'

interface StoredUser extends User { salt: string; passwordHash: string }
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
  favorites: (session: Session) => ({ userId: session.user.id, sessionId: session.id, nftIds: [...(data.favorites[session.user.id] ?? [])] }),
  favorite: (session: Session, nftId: string, add: boolean) => {
    const ids = new Set(data.favorites[session.user.id] ?? [])
    if (add) ids.add(nftId); else ids.delete(nftId)
    data.favorites[session.user.id] = [...ids]
    persist()
    return authStore.favorites(session)
  },
}
