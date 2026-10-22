import { queryOptions } from '@tanstack/react-query'
import type { CatalogFacets, CatalogSearch, Nft, NftList } from '@/api/contracts'
import { http } from '@/api/http'
import { normalizeCatalogSearch } from './search'

export const nftKeys = {
  all: ['public', 'nfts'] as const,
  lists: ['public', 'nfts', 'list'] as const,
  list: (search: CatalogSearch) => [...nftKeys.lists, search] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
}

export function catalogOptions(input: CatalogSearch) {
  const search = normalizeCatalogSearch({ ...input })
  return queryOptions({
    queryKey: nftKeys.list(search),
    queryFn: async ({ signal }) => (await http.get<NftList>('/nfts', { params: search, signal })).data,
  })
}
export function catalogFacetsOptions() {
  return queryOptions({ queryKey: [...nftKeys.all, 'facets'], queryFn: async ({ signal }) => (await http.get<CatalogFacets>('/nfts/filters', { signal })).data })
}

export function nftOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => (await http.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
  })
}
