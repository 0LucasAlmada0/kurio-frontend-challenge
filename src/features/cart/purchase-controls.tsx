import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/contracts'
import { errorMessage } from '@/api/http'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { useCart } from './queries'
import { CartLink } from './cart-link'

export function PurchaseControls({ nft, compact = false }: { nft: Nft; compact?: boolean }) {
  const [editionId, setEdition] = useState(nft.editions.find((edition) => edition.available > 0)?.id ?? nft.editions[0]!.id)
  const [quantity, setQuantity] = useState(1)
  const { change, pending, enabled } = useCart()
  const edition = nft.editions.find((item) => item.id === editionId)!
  const unavailable = !enabled || !edition.available || quantity < 1 || quantity > edition.available
  return <>
    <fieldset className="edition-options" disabled={pending}><legend>Edição:</legend>{nft.editions.map((item) => <button type="button" key={item.id} aria-label={`Edição ${item.label} de ${nft.name}${item.available ? '' : ' · esgotada'}`} aria-pressed={item.id === editionId} onClick={() => { setEdition(item.id); setQuantity(1); change.reset() }}>{item.label}</button>)}</fieldset>
    <div className={compact ? 'card-purchase-controls' : 'detail-purchase'}>
      {!compact && <p className="price detail-price" data-testid="price">{nft.priceEth} ETH</p>}
      <div className="quantity-control"><span>Qtd.</span><button type="button" disabled={pending || quantity <= 1} aria-label={`Diminuir quantidade de ${nft.name}`} onClick={() => setQuantity(quantity - 1)}><Icon name="minus" /></button><input type="number" min="1" max={edition.available || 1} value={quantity} aria-label={`Quantidade de ${nft.name}`} disabled={pending || !edition.available} onChange={(event) => setQuantity(Number(event.target.value))} /><button type="button" disabled={pending || quantity >= edition.available} aria-label={`Aumentar quantidade de ${nft.name}`} onClick={() => setQuantity(quantity + 1)}><Icon name="plus" /></button></div>
      <div className="purchase-buttons"><Button disabled={unavailable || pending} onClick={() => change.mutate({ kind: 'item', input: { nftId: nft.id, editionId, quantity, operation: 'add' } })}>{pending ? 'Adicionando…' : 'Adicionar ao carrinho'}</Button>{!compact && <><FavoriteButton nftId={nft.id} name={nft.name} className="desktop-favorite" showLabel /><CartLink className="mobile-cart" /></>}</div>
      <p className="detail-note" role="status">{!edition.available ? 'Edição esgotada.' : change.isSuccess ? <>Adicionado. <Link to="/carrinho">Ver carrinho</Link></> : `${edition.available} unidades disponíveis nesta edição.`}</p>
      {change.isError && <p className="purchase-error" role="alert">{errorMessage(change.error)}</p>}
    </div>
  </>
}
