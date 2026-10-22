import { defaultParseSearch, defaultStringifySearch } from '@tanstack/react-router'

export function parseAppSearch(search: string) {
  const params = new URLSearchParams(search)
  const prices = ['minPrice', 'maxPrice'].map((key) => [key, params.getAll(key)] as const)
  for (const [key] of prices) params.delete(key)
  const parsed = defaultParseSearch(`?${params}`) as Record<string, unknown>
  for (const [key, values] of prices) if (values.length === 1) parsed[key] = values[0]
  if (typeof parsed.q === 'number') parsed.q = params.get('q')
  return parsed
}
export function stringifyAppSearch(search: Record<string, unknown>) {
  const { minPrice, maxPrice, ...rest } = search
  const params = new URLSearchParams(defaultStringifySearch(rest))
  for (const [key, value] of Object.entries({ minPrice, maxPrice })) if (typeof value === 'string') params.set(key, value)
  return params.size ? `?${params}` : ''
}
