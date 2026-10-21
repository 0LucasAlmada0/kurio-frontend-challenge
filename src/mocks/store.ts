import type { Nft, NftUpdated } from '@/api/contracts'
import { createNfts } from './fixtures'

const storageKey = 'kurio:mocks:v1'
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
  update: (id: string): NftUpdated | undefined => {
    const nft = nfts.find((item) => item.id === id)
    if (!nft) return
    nft.priceEth = nft.priceEth === '1.49' ? '1.19' : '1.49'
    nft.available = Math.max(0, nft.available - 1)
    nft.version += 1
    persist()
    return { eventId: `${id}:v${nft.version}`, scope: 'public', resourceId: id, version: nft.version, resource: structuredClone(nft) }
  },
}
