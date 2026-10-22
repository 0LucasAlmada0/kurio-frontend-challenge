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
export interface CartItem { nftId: string; editionId: string; quantity: number; lineId?: string }
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
  collections?: string
  rarities?: string
  minPrice?: Eth
  maxPrice?: Eth
  availability?: 'available' | 'sold-out'
}
export interface CatalogFacets { collections: string[]; rarities: Rarity[]; priceRange: { min: Eth; max: Eth } }

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
export interface ProfileInput { displayName: string; username: string; email: string; ens: string; walletAlias: string; avatar: string | null }
export interface Profile extends ProfileInput { userId: string; version: number }
export interface PasswordChange { currentPassword: string; newPassword: string; confirmPassword: string }
export interface ProfileUpdate extends ProfileInput { version: number; password?: PasswordChange }
export interface Session { id: string; token: string; user: User; expiresAt: string }
export interface LoginInput { email: string; password: string }
export interface RegisterInput extends LoginInput { name: string; confirmPassword: string }
export interface Favorites { userId: string; sessionId: string; nftIds: string[] }

export type NetworkId = 'ethereum' | 'polygon'
export type WalletProvider = 'WalletConnect' | 'MetaMask' | 'Coinbase Wallet'
export interface WalletInput {
  label: string; address: string; networkId: NetworkId; kind: 'primary' | 'secondary'
  displayName?: string; profileName?: string; email?: string; ens?: string; secondaryAddress?: string; referralCode?: string
}
export interface Wallet extends WalletInput { id: string; userId: string }
export interface WalletConnection { walletId: string; provider: WalletProvider; sessionId: string; userId: string }
export interface Wallets {
  userId: string
  items: Wallet[]
  connection: WalletConnection | null
  networks: { id: NetworkId; label: string }[]
  providers: WalletProvider[]
}
export interface Collector { displayName: string; username: string; profileName: string; email: string; ens: string; referralCode: string; note: string }
export interface OrderInput { quoteId: string; walletId: string; networkId: NetworkId; collector: Collector }
export interface Order {
  id: string
  userId: string
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  version: number
  status: 'pending' | 'confirmed' | 'refused'
  transactionId: string | null
  quote: Quote
  wallet: Wallet
  provider: WalletProvider
  collector: Collector
  reason: string | null
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
  'session.ready': (event: { userId: string; sessionId: string }) => void
}
export interface ClientEvents {
  'session.subscribe': (input: { token: string; sessionId: string }) => void
  'session.unsubscribe': () => void
}
