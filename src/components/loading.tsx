import { Skeleton } from './ui/skeleton'

export function CatalogLoading() {
  return <div role="status" aria-label="Carregando NFTs" className="nft-grid">{Array.from({ length: 8 }, (_, index) => <div key={index}><Skeleton className="aspect-square rounded-3xl" /><Skeleton className="mt-4 h-5 w-4/5" /><Skeleton className="mt-2 h-5 w-1/2" /></div>)}</div>
}

export function DetailLoading() {
  return <div role="status" aria-label="Carregando NFT" className="detail-grid"><Skeleton className="aspect-square rounded-3xl" /><div><Skeleton className="h-9 w-4/5" /><Skeleton className="mt-4 h-8 w-1/3" /><Skeleton className="mt-8 h-32" /></div></div>
}
