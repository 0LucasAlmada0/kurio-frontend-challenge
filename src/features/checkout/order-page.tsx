import { useEffect } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/use-auth'
import { auth } from '@/features/auth/session'
import type { Session } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@/components/icon'
import { ErrorState } from '@/components/error-state'
import { isCartQuery } from '@/features/cart/queries'
import { nftKeys } from '@/features/catalog/queries'
import { useLiveUpdates } from '@/realtime/provider'
import { useOrder } from './queries'
import { QuoteSummary } from './quote-summary'
import { readAttempt, saveAttempt } from './attempt'

export function OrderPage() {
  const { orderId } = useParams({ strict: false })
  const session = useAuth().session
  return session && orderId ? <OrderContent key={`${session.id}:${orderId}`} session={session} id={orderId} /> : <p role="status">Recuperando sessão…</p>
}
function OrderContent({ session, id }: { session: Session; id: string }) {
  const result = useOrder(session, id)
  const order = result.data
  const client = useQueryClient()
  const navigate = useNavigate()
  const live = useLiveUpdates()
  useEffect(() => {
    if (!order || order.status === 'pending' || !auth.isCurrent(session)) return
    if (order.status === 'confirmed') {
      const attempt = readAttempt(session.user.id)
      if (attempt?.key === order.idempotencyKey) saveAttempt(session.user.id, null)
    }
    void client.invalidateQueries({ predicate: isCartQuery })
    void client.invalidateQueries({ queryKey: nftKeys.all })
  }, [order, client, session])
  if (result.isPending) return <div className="checkout-skeleton" role="status" aria-label="Carregando pedido"><Skeleton /><Skeleton /></div>
  if (result.isError) return <ErrorState error={result.error} retry={() => { void result.refetch() }} />
  if (!order || order.userId !== session.user.id) return null
  if (order.status !== 'confirmed') return <section className="order-state"><h1>{order.status === 'pending' ? 'Pedido pendente' : 'Pagamento recusado'}</h1><p data-testid="order-id">{order.id}</p><p role="status" data-testid="order-status">{order.status}</p><p>{order.status === 'pending' ? 'Aguardando a resposta da simulação. Você pode atualizar a página; nenhuma nova compra será criada.' : order.reason}</p><p role="status" data-testid="order-live" data-received={live.orderReceived}>{live.orderMessage}</p><QuoteSummary quote={order.quote} /><Button onClick={() => { void result.refetch() }}>Consultar estado</Button>{order.status === 'refused' && <Button onClick={() => { saveAttempt(session.user.id, null); void navigate({ to: '/pagamento' }) }}>Iniciar nova tentativa</Button>}<Link to="/carrinho">Voltar ao carrinho</Link></section>
  return <article className="order-receipt" aria-labelledby="receipt-heading"><Link className="receipt-close" to="/" search={{ q: '', page: 1, sort: 'name' }} aria-label="Fechar recibo">×</Link><div className="receipt-thanks"><Icon name="mail" /><h1 id="receipt-heading">Seus NFTs agora estão na sua carteira</h1><p>Compra confirmada na simulação</p></div><dl className="receipt-meta"><div><dt>ID da transação</dt><dd data-testid="transaction-id" title={order.transactionId ?? ''}>{order.transactionId?.slice(0, 10)}…{order.transactionId?.slice(-6)}</dd></div><div><dt>Data</dt><dd>{new Date(order.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</dd></div><div><dt>Total</dt><dd>{order.quote.totalEth} ETH</dd></div><div><dt>Carteira</dt><dd>{order.provider}</dd></div></dl><div className="receipt-content"><QuoteSummary quote={order.quote} receipt /><p className="receipt-wallet">{order.wallet.label} · {order.wallet.networkId}<br /><span>{order.wallet.address}</span></p><p className="simulation-note">Transação simulada. Nenhuma operação foi enviada à blockchain.</p><p className="receipt-reference" data-testid="order-id">Pedido: {order.id}</p><Link className="receipt-continue" to="/" search={{ q: '', page: 1, sort: 'name' }}>Continuar explorando</Link><Button variant="outline" disabled title="Referência de transação simulada">Exploração da blockchain indisponível</Button></div><span className="sr-only" data-testid="order-status">confirmed</span><p className="sr-only" role="status" data-testid="order-live" data-received={live.orderReceived}>{live.orderMessage}</p></article>
}
