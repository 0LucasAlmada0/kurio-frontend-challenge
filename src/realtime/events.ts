import type { NftUpdated, OrderUpdated } from '@/api/contracts'

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
    && Array.isArray(nft.editions) && nft.editions.length > 0
    && nft.editions.every((edition) => !!edition && typeof edition.id === 'string' && typeof edition.label === 'string' && Number.isSafeInteger(edition.available) && edition.available >= 0)
    && new Set(nft.editions.map((edition) => edition.id)).size === nft.editions.length
    && nft.editions.reduce((sum, edition) => sum + edition.available, 0) === nft.available
}

export function isOrderUpdated(value: unknown): value is OrderUpdated {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<OrderUpdated>
  return event.scope === 'private' && typeof event.eventId === 'string' && event.eventId.length > 0
    && typeof event.userId === 'string' && typeof event.sessionId === 'string' && typeof event.resourceId === 'string'
    && Number.isSafeInteger(event.version) && event.version! > 0 && ['pending', 'confirmed', 'refused'].includes(event.status ?? '')
}
