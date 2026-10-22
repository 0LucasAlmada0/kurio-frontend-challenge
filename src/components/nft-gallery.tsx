import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/contracts'
import { Icon } from './icon'
import { FavoriteButton } from '@/features/favorites/favorite-button'

export function NftGallery({ nft }: { nft: Nft }) {
  return <div className="nft-gallery">
    <div className="gallery-toolbar"><Link to="/" search={{ q: '', page: 1, sort: 'name' }} className="icon-button" aria-label="Voltar ao mercado"><Icon name="back" /></Link><FavoriteButton nftId={nft.id} name={nft.name} className="icon-button" /></div>
    <div className="gallery-thumbnails" aria-label="Prévias do NFT"><div className="gallery-thumbnail current"><img src={nft.image} alt={`Prévia de ${nft.name}`} width="90" height="90" /></div>{[1, 2, 3].map((slot) => <button key={slot} className="gallery-thumbnail" disabled aria-label={`Vista adicional ${slot} · indisponível`} title="Outras vistas ainda não disponíveis"><Icon name="image" /></button>)}</div>
    <div className="detail-art"><img src={nft.image} alt={nft.name} width="600" height="600" /><button className="gallery-zoom icon-button" disabled aria-label="Ampliar imagem · em breve" title="Ampliação · em breve"><Icon name="search" /></button></div>
  </div>
}
