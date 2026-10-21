import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { nftOptions } from './queries'
import { DetailLoading } from '@/components/loading'
import { ErrorState } from '@/components/error-state'

const route = getRouteApi('/nfts/$nftId')

export function NftDetailPage() {
  const { nftId } = route.useParams()
  const result = useQuery(nftOptions(nftId))
  const nft = result.data
  return <>
    <nav className="breadcrumb" aria-label="Localização"><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>Início / Mercado</Link><span aria-hidden="true"> / </span><span>Detalhe</span></nav>
    {result.isPending ? <DetailLoading /> : result.isError ? <ErrorState error={result.error} retry={() => { void result.refetch() }} /> : nft && <article className="detail-grid" data-testid={`detail-${nft.id}`}>
      <div className="detail-art"><img src={nft.image} alt={nft.name} width="600" height="600" /></div>
      <div className="detail-copy"><p className="eyebrow">{nft.collection}</p><h1>{nft.name}</h1><p className="price detail-price" data-testid="price">{nft.priceEth} ETH</p><hr /><h2>Sobre este NFT</h2><p>{nft.description}</p><dl><div><dt>Criador</dt><dd>{nft.creator}</dd></div><div><dt>Raridade</dt><dd>{nft.rarity}</dd></div><div><dt>Disponibilidade</dt><dd>{nft.available ? `${nft.available} edições disponíveis` : 'Esgotado'}</dd></div><div><dt>Rede</dt><dd>Ethereum · simulação</dd></div></dl><p className="detail-note">Compra e favoritos serão disponibilizados nas próximas etapas.</p><p className="refresh-status" role="status">{result.isFetching ? 'Atualizando NFT…' : ''}</p></div>
    </article>}
  </>
}
