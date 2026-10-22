import type { Quote } from '@/api/contracts'

export function QuoteSummary({ quote, receipt = false }: { quote: Quote; receipt?: boolean }) {
  return <section className="checkout-summary" aria-label={receipt ? 'Valores do pedido' : 'Revisão dos itens e valores'}>
    <h2>{receipt ? 'Detalhes da transação' : 'Seus NFTs'}</h2><div className="checkout-line-heading" aria-hidden="true"><span>NFTs</span><span>Edições / Subtotal</span></div>
    {quote.lines.map((line) => <div className="checkout-line" key={`${line.nftId}:${line.editionId}`}><img src={line.nft.image} alt={line.nft.name} width="70" height="70" /><div><h3>{line.nft.name}</h3><p>Edição: {line.edition.label} <span>(× {line.quantity})</span></p>{line.issue && <p role="alert">{line.issue}</p>}</div><strong>{line.totalEth} ETH</strong></div>)}
    {quote.coupon && <p>Cupom: {quote.coupon}</p>}
    <dl className="cart-totals"><div><dt>Subtotal</dt><dd>{quote.subtotalEth} ETH</dd></div><div><dt>Desconto do lançamento</dt><dd>(−) {quote.discountEth} ETH</dd></div><div><dt>Taxa de rede</dt><dd>{quote.networkFeeEth} ETH<small>Taxa estimada</small></dd></div><div className="cart-final-total"><dt>Total</dt><dd data-testid={receipt ? 'receipt-total' : 'checkout-total'}>{quote.totalEth} ETH</dd></div></dl>
  </section>
}
