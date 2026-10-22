import type { Order, OrderInput, Session, WalletInput, WalletProvider, Wallets } from '@/api/contracts'
import { normalizeCollector, validateCollector, validateWallet } from '@/features/checkout/validation'
import { cartStore, CartError } from './cart-store'
import { commerceTransaction, readCommerce, writeCommerce, type CommerceData } from './commerce-db'
import { checkoutScenario } from './checkout-scenarios'
import { emitNftUpdated, emitOrderUpdated } from './socket'

const networks: Wallets['networks'] = [{ id: 'ethereum', label: 'Rede principal Ethereum' }, { id: 'polygon', label: 'Polygon' }]
const providers: WalletProvider[] = ['WalletConnect', 'MetaMask', 'Coinbase Wallet']
const timers = new Set<ReturnType<typeof setTimeout>>()
function publishInventory(data: CommerceData, ids: Set<string>) {
  for (const id of ids) {
    const nft = data.nfts.find((item) => item.id === id)!
    emitNftUpdated({ eventId: `${id}:v${nft.version}`, scope: 'public', resourceId: id, version: nft.version, resource: structuredClone(nft) })
  }
}
function inventory(data: CommerceData, order: Order, release: boolean) {
  const ids = new Set<string>()
  for (const line of order.quote.lines) {
    const nft = data.nfts.find((item) => item.id === line.nftId)!
    const edition = nft.editions.find((item) => item.id === line.editionId)!
    if (!release && edition.available < line.quantity) throw new CartError(409, 'STOCK_LIMIT', 'Estoque insuficiente. Revise a cotação.')
    edition.available += release ? line.quantity : -line.quantity
    ids.add(nft.id)
  }
  for (const id of ids) {
    const nft = data.nfts.find((item) => item.id === id)!
    nft.available = nft.editions.reduce((sum, item) => sum + item.available, 0)
    nft.version += 1
  }
  return ids
}
export function resetOrderTimers() { for (const timer of timers) clearTimeout(timer); timers.clear() }
function schedule(at: number) {
  const timer = setTimeout(() => { timers.delete(timer); void commerceTransaction(() => settleOrders()) }, Math.max(0, at - Date.now()))
  timers.add(timer)
}
export function settleOrders() {
  const data = readCommerce()
  let changed = false
  const released = new Set<string>()
  const updated: Order[] = []
  for (const record of Object.values(data.orders)) {
    if (record.order.status !== 'pending' || record.resolveAt === null || record.resolveAt > Date.now()) continue
    const order = record.order
    order.status = record.outcome
    order.version += 1
    order.updatedAt = new Date().toISOString()
    if (order.status === 'refused') {
      order.reason = 'Pagamento recusado pela simulação. Seus itens foram preservados.'
      for (const id of inventory(data, order, true)) released.add(id)
    } else {
      order.transactionId = `0x${order.id.replace(/-/g, '').padEnd(64, '0')}`
      const cart = data.carts[order.userId]
      if (cart) {
        for (const line of order.quote.lines) {
          const current = cart.items.find((item) => item.lineId === line.lineId && item.nftId === line.nftId && item.editionId === line.editionId)
          if (current) current.quantity = Math.max(0, current.quantity - line.quantity)
        }
        cart.items = cart.items.filter((item) => item.quantity > 0)
        cart.version += 1
      }
    }
    changed = true
    updated.push(order)
  }
  if (!changed) return
  writeCommerce(data)
  publishInventory(data, released)
  for (const order of updated) emitOrderUpdated(order)
}

export const orderStore = {
  wallets(session: Session): Wallets {
    const data = readCommerce()
    return { userId: session.user.id, items: data.wallets.filter((wallet) => wallet.userId === session.user.id), connection: data.connections[session.id] ?? null, networks, providers }
  },
  addWallet(session: Session, input: WalletInput, id?: string) {
    const fields = validateWallet(input)
    if (Object.keys(fields).length) throw new CartError(422, 'VALIDATION', 'Revise os campos da carteira.', fields)
    const data = readCommerce()
    const existing = id ? data.wallets.find((wallet) => wallet.id === id) : undefined
    if (id && !existing) throw new CartError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
    if (existing && existing.userId !== session.user.id) throw new CartError(403, 'FORBIDDEN', 'Esta carteira não pertence à sua conta.')
    if (data.wallets.some((wallet) => wallet.id !== id && wallet.userId === session.user.id && wallet.address.toLowerCase() === input.address.trim().toLowerCase() && wallet.networkId === input.networkId)) throw new CartError(409, 'WALLET_EXISTS', 'Esta carteira já está cadastrada nesta rede.', { address: 'Esta carteira já está cadastrada nesta rede.' })
    if (input.kind === 'primary') for (const wallet of data.wallets) if (wallet.userId === session.user.id) wallet.kind = 'secondary'
    const wallet = { label: input.label.trim(), address: input.address.trim(), kind: input.kind, networkId: input.networkId, userId: session.user.id, id: id ?? crypto.randomUUID() }
    for (const field of ['displayName', 'profileName', 'email', 'ens', 'secondaryAddress', 'referralCode'] as const) if (input[field] !== undefined) Object.assign(wallet, { [field]: input[field]!.trim() })
    if (existing) {
      if (existing.address !== wallet.address || existing.networkId !== wallet.networkId) for (const [key, connection] of Object.entries(data.connections)) if (connection.walletId === id) delete data.connections[key]
      Object.assign(existing, wallet)
    } else data.wallets.push(wallet)
    writeCommerce(data)
    return this.wallets(session)
  },
  connect(session: Session, walletId: string, provider: WalletProvider) {
    const data = readCommerce()
    if (!data.wallets.some((wallet) => wallet.id === walletId && wallet.userId === session.user.id)) throw new CartError(403, 'FORBIDDEN', 'Esta carteira não pertence à sua conta.')
    if (!providers.includes(provider)) throw new CartError(422, 'PROVIDER_INVALID', 'Selecione um provedor válido.')
    if (checkoutScenario().connectionRefused) throw new CartError(409, 'CONNECTION_REFUSED', 'Conexão da carteira recusada. Tente novamente ou selecione outra carteira.')
    data.connections[session.id] = { userId: session.user.id, sessionId: session.id, walletId, provider }
    writeCommerce(data)
    return this.wallets(session)
  },
  disconnect(session: Session) { const data = readCommerce(); delete data.connections[session.id]; writeCommerce(data); return this.wallets(session) },
  get(session: Session, id: string) {
    const record = readCommerce().orders[id]
    if (!record) throw new CartError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    if (record.order.userId !== session.user.id) throw new CartError(403, 'FORBIDDEN', 'Este pedido pertence a outro usuário.')
    if (record.order.status === 'pending' && record.resolveAt !== null) schedule(record.resolveAt)
    return record.order
  },
  byKey(session: Session, key: string) {
    const record = Object.values(readCommerce().orders).find((item) => item.order.userId === session.user.id && item.order.idempotencyKey === key)
    if (!record) throw new CartError(404, 'ORDER_NOT_FOUND', 'Tentativa ainda não encontrada. Reenvie com a mesma chave.')
    return this.get(session, record.order.id)
  },
  async create(session: Session, key: string, input: OrderInput, authorize: () => void) {
    if (!/^[a-z\d_-]{8,128}$/i.test(key)) throw new CartError(422, 'IDEMPOTENCY_REQUIRED', 'Informe uma chave de idempotência válida.')
    const fields = validateCollector(input?.collector)
    if (Object.keys(fields).length) throw new CartError(422, 'VALIDATION', 'Revise os dados do colecionador.', fields)
    const collector = normalizeCollector(input.collector)
    const fingerprint = JSON.stringify({ quoteId: input.quoteId, walletId: input.walletId, networkId: input.networkId, collector })
    const previous = Object.values(readCommerce().orders).find((record) => record.order.userId === session.user.id && record.order.idempotencyKey === key)
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new CartError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada com outro conteúdo. Recupere a tentativa original.')
      return previous.order
    }
    const binding = readCommerce()
    const scope = `${session.user.id}:${key}`
    if (binding.idempotency[scope] && binding.idempotency[scope] !== fingerprint) throw new CartError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada com outro conteúdo. Inicie uma nova tentativa.')
    if (!binding.idempotency[scope]) { binding.idempotency[scope] = fingerprint; writeCommerce(binding) }
    const quote = await cartStore.quote(session.user.id)
    authorize()
    if (input.quoteId !== quote.id || !quote.valid || Date.parse(quote.expiresAt) <= Date.now()) throw new CartError(409, 'QUOTE_STALE', 'Cotação alterada ou vencida. Revise os novos valores e confirme novamente.')
    const data = readCommerce()
    const wallet = data.wallets.find((item) => item.id === input.walletId && item.userId === session.user.id)
    const connection = data.connections[session.id]
    if (!wallet || wallet.networkId !== input.networkId || connection?.walletId !== wallet.id) throw new CartError(409, 'WALLET_DISCONNECTED', 'Conecte uma carteira sua na rede selecionada antes de comprar.')
    const cart = data.carts[session.user.id]!
    for (const item of cart.items) item.lineId ??= crypto.randomUUID()
    for (const line of quote.lines) line.lineId = cart.items.find((item) => item.nftId === line.nftId && item.editionId === line.editionId)!.lineId
    const order: Order = { id: crypto.randomUUID(), userId: session.user.id, idempotencyKey: key, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, status: 'pending', transactionId: null, quote: structuredClone(quote), wallet: structuredClone(wallet), provider: connection.provider, collector, reason: null }
    const ids = inventory(data, order, false)
    const scenario = checkoutScenario()
    const resolveAt = scenario.payment === 'pending' ? null : Date.now() + scenario.settlementDelay
    data.orders[order.id] = { order, fingerprint, resolveAt, outcome: scenario.payment === 'refused' ? 'refused' : 'confirmed' }
    writeCommerce(data)
    publishInventory(data, ids)
    emitOrderUpdated(order)
    if (resolveAt !== null) schedule(resolveAt)
    return order
  },
  resolve(id: string, outcome: 'confirmed' | 'refused') {
    const data = readCommerce()
    const record = data.orders[id]
    if (!record) throw new CartError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    if (record.order.status !== 'pending') return record.order
    record.outcome = outcome
    record.resolveAt = Date.now()
    writeCommerce(data)
    settleOrders()
    return readCommerce().orders[id]!.order
  },
}
