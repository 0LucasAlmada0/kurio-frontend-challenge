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
  editions: NftEdition[]
}

export interface NftEdition { id: string; label: string; available: number }
export interface CartItem { nftId: string; editionId: string; quantity: number }
export interface Cart { ownerId: string; version: number; items: CartItem[]; coupon: string | null; notices: string[] }
export interface CartItemInput extends CartItem { operation?: 'add' | 'set' }
export interface QuoteLine extends CartItem {
  nft: Nft
  edition: NftEdition
  unitPriceEth: Eth
  totalEth: Eth
  issue: string | null
}
export interface Quote {
  id: string
  version: string
  ownerId: string
  cartVersion: number
  expiresAt: string
  lines: QuoteLine[]
  coupon: string | null
  subtotalEth: Eth
  discountEth: Eth
  networkFeeEth: Eth
  totalEth: Eth
  valid: boolean
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
  fields?: Record<string, string>
}

export interface User { id: string; name: string; email: string }
export interface Session { id: string; token: string; user: User; expiresAt: string }
export interface LoginInput { email: string; password: string }
export interface RegisterInput extends LoginInput { name: string; confirmPassword: string }
export interface Favorites { userId: string; sessionId: string; nftIds: string[] }

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
