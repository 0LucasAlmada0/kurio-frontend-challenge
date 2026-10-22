import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/contracts'
import { Icon } from './icon'
import { FavoriteButton } from '@/features/favorites/favorite-button'

export function NFTCard({ nft, index }: { nft: Nft; index: number }) {
  return (
    <article data-testid={`nft-${nft.id}`} className="nft-card">
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }} aria-label={`Ver ${nft.name}`}>
        <div className="nft-art">
          <img src={nft.image} alt={nft.name} width="400" height="400" loading={index < 4 ? 'eager' : 'lazy'} />
          {nft.rarity === 'lendário' && <span className="rarity">LENDÁRIO</span>}
          <span className="card-view" aria-hidden="true"><Icon name="search" /></span>
        </div>
        <h3>{nft.name}</h3>
      </Link>
      <FavoriteButton nftId={nft.id} name={nft.name} className="card-favorite" />
      <div className="card-meta"><p className="price" data-testid="price">{nft.priceEth} ETH</p><span>{nft.available ? `${nft.available} disponíveis` : 'Esgotado'}</span></div>
    </article>
  )
}
