import type { NftUpdated } from '@/api/contracts'

export function isNftUpdated(value: unknown): value is NftUpdated {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<NftUpdated>
  const nft = event.resource
  return event.scope === 'public' && typeof event.eventId === 'string' && event.eventId.length > 0
    && typeof event.resourceId === 'string' && Number.isSafeInteger(event.version) && (event.version ?? 0) > 0
    && !!nft && nft.id === event.resourceId && nft.version === event.version
    && typeof nft.name === 'string' && typeof nft.priceEth === 'string'
    && /^\d+\.\d{1,18}$/.test(nft.priceEth)
    && Number.isSafeInteger(nft.available) && nft.available >= 0
}
