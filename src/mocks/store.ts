import type { Nft, NftUpdated } from '@/api/contracts'
import { createNfts } from './fixtures'
import { readCommerce, writeCommerce } from './commerce-db'

export const store = {
  list: () => readCommerce().nfts,
  get: (id: string) => readCommerce().nfts.find((nft) => nft.id === id),
  reset: () => { const data = readCommerce(); data.nfts = createNfts(); writeCommerce(data) },
  update: (id: string, change?: { priceEth?: Nft['priceEth']; editionId?: string; available?: number }): NftUpdated | undefined => {
    const data = readCommerce()
    const nft = data.nfts.find((item) => item.id === id)
    if (!nft) return
    const explicit = change?.priceEth !== undefined || change?.available !== undefined
    if (change?.priceEth !== undefined) nft.priceEth = change.priceEth
    else if (!explicit) nft.priceEth = nft.priceEth === '1.49' ? '1.19' : '1.49'
    const edition = nft.editions.find((item) => item.id === change?.editionId) ?? nft.editions.find((item) => item.available > 0)
    if (edition && change?.available !== undefined) edition.available = change.available
    else if (edition && !explicit) edition.available = Math.max(0, edition.available - 1)
    nft.available = nft.editions.reduce((total, item) => total + item.available, 0)
    nft.version += 1
    writeCommerce(data)
    return { eventId: `${id}:v${nft.version}`, scope: 'public', resourceId: id, version: nft.version, resource: structuredClone(nft) }
  },
}
