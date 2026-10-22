import type { Nft, NftUpdated } from '@/api/contracts'
import { createNfts } from './fixtures'

const storageKey = 'kurio:mocks:v2'
function load(): Nft[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (Array.isArray(saved) && saved.length === 12 && saved.every((item: Partial<Nft>) => typeof item.id === 'string' && typeof item.priceEth === 'string' && Number.isSafeInteger(item.version))) return saved as Nft[]
  } catch { /* Storage can be unavailable in private browsing. */ }
  return createNfts()
}

let nfts = load()
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(nfts)) } catch { /* In-memory mode remains usable. */ }
}

export const store = {
  list: () => structuredClone(nfts),
  get: (id: string) => structuredClone(nfts.find((nft) => nft.id === id)),
  reset: () => { nfts = createNfts(); persist() },
  update: (id: string, change?: { priceEth?: Nft['priceEth']; editionId?: string; available?: number }): NftUpdated | undefined => {
    const nft = nfts.find((item) => item.id === id)
    if (!nft) return
    const explicit = change?.priceEth !== undefined || change?.available !== undefined
    if (change?.priceEth !== undefined) nft.priceEth = change.priceEth
    else if (!explicit) nft.priceEth = nft.priceEth === '1.49' ? '1.19' : '1.49'
    const edition = nft.editions.find((item) => item.id === change?.editionId) ?? nft.editions.find((item) => item.available > 0)
    if (edition && change?.available !== undefined) edition.available = change.available
    else if (edition && !explicit) edition.available = Math.max(0, edition.available - 1)
    nft.available = nft.editions.reduce((total, item) => total + item.available, 0)
    nft.version += 1
    persist()
    return { eventId: `${id}:v${nft.version}`, scope: 'public', resourceId: id, version: nft.version, resource: structuredClone(nft) }
  },
}
