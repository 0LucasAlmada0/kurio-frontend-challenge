import { Skeleton } from './ui/skeleton'

export function CatalogLoading() {
  return <div role="status" aria-label="Carregando NFTs" className="nft-grid">{Array.from({ length: 8 }, (_, index) => <div key={index}><Skeleton className="aspect-square rounded-3xl" /><Skeleton className="mt-4 h-5 w-4/5" /><Skeleton className="mt-2 h-5 w-1/2" /></div>)}</div>
}

export function DetailLoading() {
  return <div role="status" aria-label="Carregando NFT"><div className="detail-grid"><Skeleton className="aspect-square rounded-3xl" /><div><Skeleton className="h-9 w-4/5" /><Skeleton className="mt-4 h-8 w-1/3" /><Skeleton className="mt-8 h-32" /></div></div><div className="nft-information" aria-hidden="true"><Skeleton className="h-6 w-1/3" /><Skeleton className="mt-4 h-24" /><Skeleton className="mt-4 h-16" /></div><div className="related-nfts" aria-hidden="true"><h2><Skeleton className="h-6 w-1/3" /></h2><div className="related-grid">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="nft-card aspect-square" />)}</div></div></div>
}
