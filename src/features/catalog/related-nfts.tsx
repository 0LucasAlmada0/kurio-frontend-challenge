import { useQuery } from '@tanstack/react-query'
import { catalogOptions } from './queries'
import { NFTCard } from '@/components/nft-card'
import { Skeleton } from '@/components/ui/skeleton'

export function RelatedNfts({ collection, currentId }: { collection: string; currentId: string }) {
  const result = useQuery(catalogOptions({ q: collection, page: 1, sort: 'name' }))
  if (result.isError || (result.isSuccess && !result.data.items.some((nft) => nft.id !== currentId))) return null
  return <section className="related-nfts" aria-labelledby="related-heading"><h2 id="related-heading">Mais desta coleção</h2><div className="related-grid">{result.isPending ? Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="aspect-square" />) : result.data.items.filter((nft) => nft.id !== currentId).slice(0, 5).map((nft, index) => <NFTCard key={nft.id} nft={nft} index={index} />)}</div></section>
}
