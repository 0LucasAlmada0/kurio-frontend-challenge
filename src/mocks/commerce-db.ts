import type { Cart, Nft, Order, Wallet, WalletConnection } from '@/api/contracts'
import { createNfts } from './fixtures'

export interface StoredOrder { order: Order; fingerprint: string; resolveAt: number | null; outcome: 'confirmed' | 'refused' }
export interface CommerceData {
  nfts: Nft[]
  carts: Record<string, Cart>
  consumed: string[]
  wallets: Wallet[]
  connections: Record<string, WalletConnection>
  orders: Record<string, StoredOrder>
  idempotency: Record<string, string>
  quoteEpoch: number
}
const key = 'kurio:mock-commerce:v1'
function fresh(): CommerceData {
  const wallets: Wallet[] = ['ana', 'bruno'].flatMap((name, index) => [
    { id: `wallet-${name}-primary`, userId: `user-${name}`, label: 'Principal', kind: 'primary', address: `0x${String(index + 1).repeat(40)}`, networkId: 'ethereum' },
    { id: `wallet-${name}-secondary`, userId: `user-${name}`, label: 'Reserva', kind: 'secondary', address: `${name}.kurio.eth`, networkId: 'polygon' },
  ])
  return { nfts: createNfts(), carts: {}, consumed: [], wallets, connections: {}, orders: {}, idempotency: {}, quoteEpoch: 0 }
}
let memory: CommerceData | undefined
let storageAvailable = true
export function readCommerce(): CommerceData {
  try {
    const saved = storageAvailable ? localStorage.getItem(key) : null
    if (saved) { const data = JSON.parse(saved) as CommerceData; data.idempotency ??= {}; return data }
    if (!memory) {
      memory = fresh()
      const nfts = storageAvailable ? JSON.parse(localStorage.getItem('kurio:mocks:v2') || 'null') as Nft[] | null : null
      const carts = storageAvailable ? JSON.parse(localStorage.getItem('kurio:mock-carts:v1') || 'null') as Pick<CommerceData, 'carts' | 'consumed'> | null : null
      if (nfts?.length === 12) memory.nfts = nfts
      if (carts) { memory.carts = carts.carts; memory.consumed = carts.consumed }
    }
  } catch { storageAvailable = false }
  return structuredClone(memory ??= fresh())
}
export function writeCommerce(data: CommerceData) {
  // A single persisted snapshot commits inventory, order and cart effects together.
  try { if (storageAvailable) localStorage.setItem(key, JSON.stringify(data)) } catch { storageAvailable = false }
  memory = structuredClone(data)
}
export function resetCommerce() { writeCommerce(fresh()) }
let queue: Promise<unknown> = Promise.resolve()
export async function commerceTransaction<T>(action: () => T | Promise<T>): Promise<T> {
  if (navigator.locks) return await navigator.locks.request('kurio-commerce', action)
  const result = queue.then(action)
  queue = result.catch(() => undefined)
  return result
}
