import type { ApiError, Cart, CartItemInput, Quote, QuoteLine } from '@/api/contracts'
import { ethToWei, weiToEth } from '@/lib/eth'
import { store } from './store'

const key = 'kurio:mock-carts:v1'
type Data = { carts: Record<string, Cart>; consumed: string[] }
let memory: Data = { carts: {}, consumed: [] }
function read(): Data {
  try { return JSON.parse(localStorage.getItem(key) || 'null') as Data || memory } catch { return memory }
}
function write(data: Data) {
  memory = data
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* The mock remains usable in memory. */ }
}
export class CartError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
  body(): ApiError { return { code: this.code, message: this.message } }
}
function cart(data: Data, ownerId: string): Cart {
  if (data.consumed.includes(ownerId)) throw new CartError(410, 'GUEST_MERGED', 'Este carrinho visitante já foi reconciliado. Atualize a página.')
  return data.carts[ownerId] ??= { ownerId, version: 1, items: [], coupon: null, notices: [] }
}
function edition(nftId: string, editionId: string) {
  const nft = store.get(nftId)
  const selected = nft?.editions.find((item) => item.id === editionId)
  if (!nft || !selected) throw new CartError(404, 'EDITION_NOT_FOUND', 'NFT ou edição não encontrado.')
  return { nft, selected }
}
function coupon(code: string) {
  if (code === 'EXPIRADO') throw new CartError(422, 'COUPON_EXPIRED', 'Este cupom expirou.')
  if (code !== 'KURIO10') throw new CartError(422, 'COUPON_INVALID', 'Código promocional inválido.')
  return code
}

export const cartStore = {
  reset() { write({ carts: {}, consumed: [] }) },
  get(ownerId: string) { return structuredClone(cart(read(), ownerId)) },
  change(ownerId: string, input: CartItemInput) {
    const data = read()
    const current = cart(data, ownerId)
    const { selected } = edition(input.nftId, input.editionId)
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 10_000) throw new CartError(422, 'QUANTITY_INVALID', 'Informe uma quantidade inteira válida.')
    const existing = current.items.find((item) => item.nftId === input.nftId && item.editionId === input.editionId)
    const quantity = input.operation === 'add' ? (existing?.quantity ?? 0) + input.quantity : input.quantity
    if (quantity > selected.available) throw new CartError(409, 'STOCK_LIMIT', selected.available ? `Apenas ${selected.available} unidades disponíveis nesta edição.` : 'Esta edição está esgotada.')
    if (existing) existing.quantity = quantity
    else current.items.push({ nftId: input.nftId, editionId: input.editionId, quantity })
    current.version += 1
    current.notices = []
    write(data)
    return structuredClone(current)
  },
  remove(ownerId: string, nftId: string, editionId: string) {
    const data = read()
    const current = cart(data, ownerId)
    current.items = current.items.filter((item) => item.nftId !== nftId || item.editionId !== editionId)
    current.version += 1
    current.notices = []
    write(data)
    return structuredClone(current)
  },
  coupon(ownerId: string, code: string | null) {
    const accepted = code === null ? null : coupon(code.trim().toUpperCase())
    const data = read()
    const current = cart(data, ownerId)
    current.coupon = accepted
    current.version += 1
    write(data)
    return structuredClone(current)
  },
  merge(guestId: string | null, userId: string) {
    if (!guestId || !/^guest:[\da-f-]{36}$/i.test(guestId)) return
    const data = read()
    if (data.consumed.includes(guestId)) return
    const visitor = data.carts[guestId]
    const target = cart(data, userId)
    if (visitor) {
      for (const item of visitor.items) {
        const existing = target.items.find((line) => line.nftId === item.nftId && line.editionId === item.editionId)
        const { selected, nft } = edition(item.nftId, item.editionId)
        const requested = (existing?.quantity ?? 0) + item.quantity
        // Keep unavailable lines visible; quotes block them until corrected.
        const quantity = selected.available ? Math.min(requested, selected.available) : requested
        if (requested !== quantity) target.notices.push(`${nft.name}: quantidade ajustada ao estoque (${quantity}).`)
        if (existing) existing.quantity = quantity
        else target.items.push({ ...item, quantity })
      }
      target.coupon ??= visitor.coupon
      target.version += 1
      if (visitor.items.length) target.notices.push('Carrinho visitante preservado e combinado com sua conta.')
      delete data.carts[guestId]
    }
    data.consumed.push(guestId)
    write(data)
  },
  async quote(ownerId: string): Promise<Quote> {
    const current = this.get(ownerId)
    const lines: QuoteLine[] = current.items.map((item) => {
      const { nft, selected } = edition(item.nftId, item.editionId)
      return { ...item, nft, edition: selected, unitPriceEth: nft.priceEth, totalEth: weiToEth(ethToWei(nft.priceEth) * BigInt(item.quantity)), issue: item.quantity > selected.available ? (selected.available ? `Estoque reduzido: ${selected.available} disponíveis.` : 'Edição esgotada. Remova este item.') : null }
    })
    const subtotal = lines.reduce((sum, line) => sum + ethToWei(line.totalEth), 0n)
    const discount = current.coupon === 'KURIO10' ? subtotal * 10n / 100n : 0n
    const fee = lines.length ? ethToWei('0.016') : 0n
    const expiresAt = new Date((Math.floor(Date.now() / 300_000) + 1) * 300_000).toISOString()
    const fingerprint = JSON.stringify({ ownerId, cart: current.version, resources: lines.map((line) => [line.nftId, line.editionId, line.nft.version, line.quantity]), coupon: current.coupon, policy: 1, expiresAt })
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))
    const version = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('')
    return { id: `quote-${version}`, version, ownerId, cartVersion: current.version, expiresAt, lines, coupon: current.coupon, subtotalEth: weiToEth(subtotal), discountEth: weiToEth(discount), networkFeeEth: weiToEth(fee), totalEth: weiToEth(subtotal - discount + fee), valid: lines.length > 0 && lines.every((line) => !line.issue) }
  },
}
