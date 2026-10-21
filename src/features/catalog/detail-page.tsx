import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { nftOptions } from './queries'
import { DetailLoading } from '@/components/loading'
import { ErrorState } from '@/components/error-state'
import { NftGallery } from '@/components/nft-gallery'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { RelatedNfts } from './related-nfts'

const route = getRouteApi('/nfts/$nftId')

export function NftDetailPage() {
  const { nftId } = route.useParams()
  const result = useQuery(nftOptions(nftId))
  const nft = result.data
  return <>
    <nav className="breadcrumb" aria-label="Localização"><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>Início / Mercado</Link><span aria-hidden="true"> / </span><span>Detalhe</span></nav>
    {result.isPending ? <DetailLoading /> : result.isError ? <ErrorState error={result.error} retry={() => { void result.refetch() }} /> : nft && <>
      <article className="detail-grid" data-testid={`detail-${nft.id}`}>
        <NftGallery nft={nft} />
        <div className="detail-copy"><h1>{nft.name}</h1><span className="review-placeholder" title="Avaliações ainda não disponíveis">★ <span>Em breve</span></span>
          <div className="detail-about"><h2>Sobre este NFT:</h2><p>{nft.description}</p></div>
          <fieldset className="edition-options" disabled><legend>Edição: <span>em breve</span></legend>{['1/1', '1/10', '1/50', 'ABERTA'].map((edition) => <button key={edition} disabled>{edition}</button>)}</fieldset>
          <div className="detail-purchase"><p className="price detail-price" data-testid="price">{nft.priceEth} ETH</p><div className="quantity-control" aria-label="Quantidade indisponível"><span>Qtd.</span><button disabled aria-label="Diminuir quantidade · em breve"><Icon name="minus" /></button><span>1</span><button disabled aria-label="Aumentar quantidade · em breve"><Icon name="plus" /></button></div><div className="purchase-buttons"><Button disabled title="Compras ainda não disponíveis">Comprar NFT</Button><Button className="desktop-favorite" variant="outline" disabled title="Favoritos ainda não disponíveis"><Icon name="heart" /><span>Favoritar</span></Button><Button className="mobile-cart" variant="outline" disabled aria-label="Adicionar ao carrinho · em breve" title="Carrinho ainda não disponível"><Icon name="cart" /></Button></div><p className="detail-note">Compra, edições e favoritos em breve.</p></div>
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
