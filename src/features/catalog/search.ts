import type { CatalogSearch, Eth } from '@/api/contracts'
import { ethToWei, weiToEth } from '@/lib/eth'

export const catalogDefaults: CatalogSearch = { q: '', page: 1, sort: 'name' }
export type CatalogChange = Partial<CatalogSearch> | ((previous: CatalogSearch) => Partial<CatalogSearch>)
export const selections = (value?: string) => value ? value.split(',') : []
export function priceParam(value: unknown): Eth | undefined {
  if (typeof value !== 'string' || !/^\d{1,24}(?:\.\d{1,18})?$/.test(value.trim())) return
  const [whole, fraction = '0'] = value.trim().split('.')
  return weiToEth(ethToWei(`${whole}.${fraction}` as Eth))
}
function csv(value: unknown, allowed?: string[]) {
  if (typeof value !== 'string' || value.length > 500) return undefined
  return [...new Set(value.split(',').map((item) => item.trim()).filter((item) => item && item.length <= 80 && (!allowed || allowed.includes(item))))].sort().join(',') || undefined
}
export function normalizeCatalogSearch(input: Record<string, unknown>): CatalogSearch {
  const page = typeof input.page === 'number' || typeof input.page === 'string' ? Number(input.page) : NaN
  const result: CatalogSearch = {
    q: typeof input.q === 'string' ? input.q.trim().slice(0, 120) : '',
    page: Number.isSafeInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1,
    sort: input.sort === 'price-asc' || input.sort === 'price-desc' ? input.sort : 'name',
  }
  const collections = csv(input.collections)
  const rarities = csv(input.rarities, ['comum', 'raro', 'lendário'])
  if (collections) result.collections = collections
  if (rarities) result.rarities = rarities
  const min = priceParam(input.minPrice)
  const max = priceParam(input.maxPrice)
  if (!(min && max && ethToWei(min) > ethToWei(max))) {
    if (min) result.minPrice = min
    if (max) result.maxPrice = max
  }
  if (input.availability === 'available' || input.availability === 'sold-out') result.availability = input.availability
  return result
}
