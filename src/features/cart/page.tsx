import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useCart } from './queries'
import { errorMessage } from '@/api/http'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/error-state'
import { Icon } from '@/components/icon'
import { RelatedNfts } from '@/features/catalog/related-nfts'
import { useLiveUpdates } from '@/realtime/provider'

export function CartPage() {
  const state = useCart(true)
  return <CartContent key={state.identity} state={state} />
}

function CartContent({ state }: { state: ReturnType<typeof useCart> }) {
  const { cart, quote, change, pending, enabled } = state
  const [code, setCode] = useState('')
  const live = useLiveUpdates()
  const data = quote.data
  const [expiredId, setExpiredId] = useState('')
  const expiresAt = data?.expiresAt
  const quoteId = data?.id
  const refetch = quote.refetch
  useEffect(() => {
    if (!expiresAt || !quoteId) return
    const timer = setTimeout(() => { setExpiredId(quoteId); void refetch() }, Math.max(0, Date.parse(expiresAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [expiresAt, quoteId, refetch])
  const stale = quote.isFetching || quote.isError || !data || expiredId === data.id || data.cartVersion !== cart.data?.version || pending
  return <div className="cart-page">
    <nav className="breadcrumb" aria-label="Localização"><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>Início / Mercado</Link><span> / Carrinho</span></nav>
    <div className="cart-title"><Link to="/" search={{ q: '', page: 1, sort: 'name' }} aria-label="Voltar ao mercado">‹</Link><h1>Carrinho de NFTs</h1></div>
    {!enabled ? <p role="status">Recuperando sessão…</p> : cart.isPending || (cart.data?.items.length !== 0 && quote.isPending) ? <div role="status" aria-label="Carregando carrinho" className="cart-skeleton"><Skeleton /><Skeleton /><Skeleton /></div> : cart.isError && !cart.data ? <ErrorState error={cart.error} retry={() => { void cart.refetch() }} /> : !cart.data?.items.length ? <div className="state-panel"><h2>Seu carrinho está vazio</h2><p>Explore o mercado e escolha suas edições.</p><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>Continuar explorando</Link></div> : <>
      <p className="cart-feedback" role="status">{pending ? 'Salvando carrinho…' : stale ? 'Cotação desatualizada. Atualizando valores…' : live.received ? 'Preço ou disponibilidade alterados. Cotação atualizada.' : change.isSuccess ? 'Carrinho atualizado.' : ''}</p>
      {cart.data.notices.map((notice) => <p className="cart-feedback" role="status" key={notice}>{notice}</p>)}
      {change.isError && <p role="alert">{errorMessage(change.error)}</p>}
      {cart.isError && <ErrorState error={cart.error} retry={() => { void cart.refetch() }} />}
      {quote.isError && <ErrorState error={quote.error} retry={() => { void quote.refetch() }} />}
      <div className="cart-layout">
        <section aria-label="Itens do carrinho" className="cart-items" aria-busy={pending || quote.isFetching}>
          <div className="cart-columns" aria-hidden="true"><span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span><span /></div>
          {data?.lines.map((line) => <article key={`${line.nftId}:${line.editionId}`} className="cart-item" data-testid={`cart-${line.nftId}-${line.editionId}`}>
            <Link className="cart-item-art" to="/nfts/$nftId" params={{ nftId: line.nftId }}><img src={line.nft.image} width="100" height="100" alt={line.nft.name} /></Link>
            <div className="cart-item-name"><Link to="/nfts/$nftId" params={{ nftId: line.nftId }}><h2>{line.nft.name}</h2></Link><p>Edição: {line.edition.label}</p></div>
            <p className="cart-unit">{line.unitPriceEth} ETH</p>
            <div className="cart-quantity"><button aria-label={`Diminuir ${line.nft.name}, edição ${line.edition.label}`} disabled={pending || line.quantity <= 1} onClick={() => change.mutate({ kind: 'item', input: { nftId: line.nftId, editionId: line.editionId, quantity: line.quantity - 1, operation: 'set' } })}><Icon name="minus" /></button><label><span className="sr-only">Quantidade de {line.nft.name}, edição {line.edition.label}</span><input type="number" min="1" max={line.edition.available || 1} value={line.quantity} disabled={pending} onChange={(event) => { const quantity = Number(event.target.value); if (Number.isSafeInteger(quantity) && quantity > 0) change.mutate({ kind: 'item', input: { nftId: line.nftId, editionId: line.editionId, quantity, operation: 'set' } }) }} /></label><button aria-label={`Aumentar ${line.nft.name}, edição ${line.edition.label}`} disabled={pending || line.quantity >= line.edition.available} onClick={() => change.mutate({ kind: 'item', input: { nftId: line.nftId, editionId: line.editionId, quantity: line.quantity + 1, operation: 'set' } })}><Icon name="plus" /></button></div>
            <p className="cart-line-total">{line.totalEth} ETH</p>
            <button className="cart-remove" aria-label={`Remover ${line.nft.name}, edição ${line.edition.label}`} disabled={pending} onClick={() => change.mutate({ kind: 'remove', nftId: line.nftId, editionId: line.editionId })}><Icon name="trash" /></button>
            {line.issue && <p className="cart-line-issue" role="alert">{line.issue}</p>}
          </article>)}
        </section>
        <aside className="cart-summary" aria-labelledby="summary-heading"><h2 id="summary-heading">Resumo da carteira</h2>
          <form className="coupon-form" onSubmit={(event) => { event.preventDefault(); if (code.trim() && !pending) change.mutate({ kind: 'coupon', code }) }}><label htmlFor="coupon">Código promocional</label><div><Input id="coupon" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Digite o código promocional…" maxLength={40} disabled={pending} /><Button disabled={pending || !code.trim()} type="submit">Aplicar</Button></div></form>
          {data?.coupon && <p className="coupon-applied" role="status">{data.coupon} aplicado <button disabled={pending} onClick={() => change.mutate({ kind: 'coupon', code: null })}>Remover cupom</button></p>}
          <dl className="cart-totals" aria-busy={stale}><div><dt>Subtotal</dt><dd data-testid="quote-subtotal">{data?.subtotalEth ?? '—'} ETH</dd></div><div><dt>Desconto do lançamento</dt><dd data-testid="quote-discount">(−) {data?.discountEth ?? '—'} ETH</dd></div><div><dt>Taxa de rede</dt><dd>{data?.networkFeeEth ?? '—'} ETH<small>Taxa estimada</small></dd></div><div className="cart-final-total"><dt>Total</dt><dd data-testid="quote-total">{data?.totalEth ?? '—'} ETH</dd></div></dl>
          <Button className="checkout-action" disabled title="Checkout disponível na próxima etapa">Continuar ao checkout</Button><p className="checkout-note">Checkout em breve. Nenhuma compra será realizada.</p><Link className="continue-shopping" to="/" search={{ q: '', page: 1, sort: 'name' }}>Continuar explorando</Link>
        </aside>
      </div>
    </>}
    {cart.data?.items.length ? <RelatedNfts collection="Kurio" currentId={cart.data.items[0]!.nftId} /> : null}
  </div>
}
