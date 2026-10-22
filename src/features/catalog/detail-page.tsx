import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { nftOptions } from './queries'
import { DetailLoading } from '@/components/loading'
import { ErrorState } from '@/components/error-state'
import { NftGallery } from '@/components/nft-gallery'
import { Icon } from '@/components/icon'
import { RelatedNfts } from './related-nfts'
import { PurchaseControls } from '@/features/cart/purchase-controls'

export function NftDetailPage({ nftId: suppliedId }: { nftId?: string } = {}) {
  const params = useParams({ strict: false })
  const nftId = suppliedId ?? params.nftId ?? ''
  const result = useQuery(nftOptions(nftId))
  const nft = result.data
  return <>
    <nav className="breadcrumb" aria-label="Localização"><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>Início / Mercado</Link><span aria-hidden="true"> / </span><span>Detalhe</span></nav>
    {result.isPending ? <DetailLoading /> : result.isError ? <ErrorState error={result.error} retry={() => { void result.refetch() }} /> : nft && <>
      <article className="detail-grid" data-testid={`detail-${nft.id}`}>
        <NftGallery nft={nft} />
        <div className="detail-copy"><h1>{nft.name}</h1><span className="review-placeholder" title="Avaliações ainda não disponíveis">★ <span>Em breve</span></span>
          <div className="detail-about"><h2>Sobre este NFT:</h2><p>{nft.description}</p></div>
          <PurchaseControls key={nft.id} nft={nft} />
          <dl className="detail-meta"><div><dt>ID do NFT:</dt><dd>{nft.id}</dd></div><div><dt>Coleção:</dt><dd>{nft.collection}</dd></div><div><dt>Criador:</dt><dd>{nft.creator}</dd></div><div><dt>Raridade:</dt><dd>{nft.rarity}</dd></div><div><dt>Disponibilidade:</dt><dd>{nft.available ? `${nft.available} edições disponíveis` : 'Esgotado'}</dd></div></dl>
          <div className="detail-share"><span>Compartilhar:</span><button disabled aria-label="Compartilhar por e-mail · em breve" title="Compartilhamento · em breve"><Icon name="mail" /></button></div>
          <p className="refresh-status" role="status">{result.isFetching ? 'Atualizando NFT…' : ''}</p>
        </div>
      </article>
      <section className="nft-information" aria-labelledby="information-heading"><div className="information-tabs"><h2 id="information-heading">Detalhes do NFT</h2><button disabled title="Avaliações ainda não disponíveis">Avaliações de colecionadores <span>· em breve</span></button></div><p>{nft.description}</p><h3>Rede:</h3><p>Ethereum · ambiente de demonstração.</p><h3>Procedência:</h3><p>Coleção {nft.collection}, por {nft.creator}. Dados e disponibilidade fornecidos pela API simulada.</p></section>
      <RelatedNfts collection={nft.collection} currentId={nft.id} />
    </>}
  </>
}
