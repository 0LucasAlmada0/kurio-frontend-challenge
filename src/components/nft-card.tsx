import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { Nft } from '@/api/contracts'
import { Icon } from './icon'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { PurchaseControls } from '@/features/cart/purchase-controls'
import { nftImageSrcSet } from '@/lib/nft-image'

export function NFTCard({ nft, index }: { nft: Nft; index: number }) {
  const [purchaseOpened, setPurchaseOpened] = useState(false)
  return (
    <article data-testid={`nft-${nft.id}`} className="nft-card">
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }} aria-label={`Ver ${nft.rarity === 'lendário' ? 'LENDÁRIO ' : ''}${nft.name}`}>
        <div className="nft-art">
          <img src={nft.image} srcSet={nftImageSrcSet(nft.image)} alt={`Arte digital de ${nft.name}`} width="400" height="400" loading={index < 4 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : undefined} decoding="async" />
          {nft.rarity === 'lendário' && <span className="rarity">LENDÁRIO</span>}
          <span className="card-view" aria-hidden="true"><Icon name="search" /></span>
        </div>
        <h3>{nft.name}</h3>
      </Link>
      <FavoriteButton nftId={nft.id} name={nft.name} className="card-favorite" />
      <div className="card-meta"><p className="price" data-testid="price">{nft.priceEth} ETH</p><span>{nft.available ? `${nft.available} disponíveis` : 'Esgotado'}</span></div>
      <details className="card-purchase" onToggle={(event) => { if (event.currentTarget.open) setPurchaseOpened(true) }}><summary><Icon name="cart" /><span>Escolher edição</span></summary>{purchaseOpened && <PurchaseControls nft={nft} compact />}</details>
    </article>
  )
}
