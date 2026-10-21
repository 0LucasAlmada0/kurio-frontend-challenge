export type Eth = `${number}.${number}`
export type Rarity = 'comum' | 'raro' | 'lendário'

export interface Nft {
  id: string
  name: string
  image: string
  collection: string
  creator: string
  rarity: Rarity
  priceEth: Eth
  available: number
  version: number
  description: string
}

export interface CatalogSearch {
  q: string
  page: number
  sort: 'name' | 'price-asc' | 'price-desc'
}

export interface NftList {
  items: Nft[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  code: string
  message: string
}

export interface NftUpdated {
  eventId: string
  scope: 'public'
  resourceId: string
  version: number
  resource: Nft
}

export interface OrderUpdated {
  eventId: string
  scope: 'private'
  sessionId: string
  userId: string
  resourceId: string
  version: number
  status: 'pending' | 'confirmed' | 'refused'
}

export interface ServerEvents {
  'nft.updated': (event: NftUpdated) => void
  'order.updated': (event: OrderUpdated) => void
}
