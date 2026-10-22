import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import type { ApiError, Collector, Order, Session, WalletProvider } from '@/api/contracts'
import { errorMessage } from '@/api/http'
import { useAuth } from '@/features/auth/use-auth'
import { auth } from '@/features/auth/session'
import { isCartQuery, useCart } from '@/features/cart/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/error-state'
import { orderKeys, useWallets } from './queries'
import { QuoteSummary } from './quote-summary'
import { WalletPanel } from './wallet-panel'
import { normalizeCollector, validateCollector } from './validation'
import { readAttempt, readCollector, saveAttempt, saveCollector, type Attempt } from './attempt'

export function CheckoutPage() {
  const state = useAuth()
  return state.session ? <Checkout key={state.session.id} session={state.session} /> : <p role="status">Recuperando sessão…</p>
}
function Checkout({ session }: { session: Session }) {
  const { cart, quote } = useCart(true)
  const wallets = useWallets(session)
  const client = useQueryClient()
  const navigate = useNavigate()
  const [collector, setCollector] = useState<Collector>(() => readCollector(session.user.id) ?? { displayName: session.user.name, username: session.user.name.replace(/[^\p{L}\d_.-]/gu, ''), profileName: session.user.name, email: session.user.email, ens: '', referralCode: '', note: '' })
  const [fields, setFields] = useState<Record<string, string>>({})
  const [selectedId, selectWallet] = useState('')
  const [chosenProvider, chooseProvider] = useState<WalletProvider | null>(null)
  const [reviewed, review] = useState('')
  const [attempt, setAttempt] = useState<Attempt | null>(() => readAttempt(session.user.id))
  const lock = useRef(false)
  const walletData = wallets.query.data
  const wallet = selectedId ? walletData?.items.find((item) => item.id === selectedId) : walletData?.items.find((item) => item.id === walletData.connection?.walletId) ?? walletData?.items.find((item) => item.kind === 'primary') ?? walletData?.items[0]
  const provider = chosenProvider ?? walletData?.connection?.provider ?? walletData?.providers[0]
  const connected = wallet && provider && walletData?.connection?.walletId === wallet.id && walletData.connection.provider === provider
  const recovered = useQuery({ queryKey: [...orderKeys(session), 'attempt', attempt?.key], enabled: !!attempt, queryFn: ({ signal }) => auth.request<Order>(session, { url: `/orders/by-key/${encodeURIComponent(attempt!.key)}`, signal }), retry: false, staleTime: 0 })
  useEffect(() => {
    const order = recovered.data
    if (order && auth.isCurrent(session)) void navigate({ to: '/pedidos/$orderId', params: { orderId: order.id }, replace: true })
  }, [recovered.data, session, navigate])
  const purchase = useMutation({
    mutationKey: [...orderKeys(session), 'create'],
    mutationFn: async ({ attempt: value, recovery }: { attempt: Attempt; recovery: boolean }) => {
      if (recovery) {
        try { return await auth.request<Order>(session, { url: `/orders/by-key/${encodeURIComponent(value.key)}` }) }
        catch (error) { if (!axios.isAxiosError(error) || error.response?.status !== 404) throw error }
      } else await auth.request(session, { url: '/cart/quote/validate', method: 'POST', data: { id: value.input.quoteId } })
      return auth.request<Order>(session, { url: '/orders', method: 'POST', headers: { 'Idempotency-Key': value.key }, data: value.input })
    },
    onSuccess: (order, variables) => {
      if (!auth.isCurrent(session)) return
      saveAttempt(session.user.id, { ...variables.attempt, orderId: order.id })
      client.setQueryData<Order>([...orderKeys(session), order.id], (previous) => !previous || (previous.status === 'pending' && order.version > previous.version) ? order : previous)
      void navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
    },
    onError: (error) => {
      if (!auth.isCurrent(session)) return
      if (axios.isAxiosError<ApiError>(error)) {
        setFields(error.response?.data.fields ?? {})
        if (['QUOTE_STALE', 'STOCK_LIMIT', 'WALLET_DISCONNECTED', 'VALIDATION'].includes(error.response?.data.code ?? '')) {
          saveAttempt(session.user.id, null); setAttempt(null); review('')
          void client.invalidateQueries({ predicate: isCartQuery })
        }
      }
    },
    onSettled: () => { lock.current = false },
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    if (lock.current || purchase.isPending || attempt) return
    const errors = validateCollector(collector)
    setFields(errors)
    if (Object.keys(errors).length || !quote.data?.valid || quote.isFetching || quote.isError || !wallet || !connected || reviewed !== quote.data.id) return
    const value: Attempt = { key: crypto.randomUUID(), input: { quoteId: quote.data.id, walletId: wallet.id, networkId: wallet.networkId, collector: normalizeCollector(collector) } }
    lock.current = true
    saveCollector(session.user.id, collector)
    saveAttempt(session.user.id, value)
    setAttempt(value)
    purchase.mutate({ attempt: value, recovery: false })
  }
  function field(name: keyof Collector, label: string, required = true) {
    return <label className="collector-field" htmlFor={`collector-${name}`}>{label}{required && <span aria-hidden="true"> *</span>}<Input id={`collector-${name}`} type={name === 'email' ? 'email' : 'text'} value={collector[name]} maxLength={name === 'email' ? 254 : 60} required={required} disabled={purchase.isPending} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `collector-error-${name}` : undefined} onChange={(event) => { const next = { ...collector, [name]: event.target.value }; setCollector(next); setFields((previous) => { const remaining = { ...previous }; delete remaining[name]; return remaining }); saveCollector(session.user.id, next); review('') }} />{fields[name] && <small role="alert" id={`collector-error-${name}`}>{fields[name]}</small>}</label>
  }
  const loading = cart.isPending || quote.isPending || wallets.query.isPending
  return <div className="checkout-page"><nav className="breadcrumb" aria-label="Localização"><Link to="/carrinho">Início / Mercado / Carrinho</Link><span> / Pagamento</span></nav><div className="checkout-title"><Link to="/carrinho" aria-label="Voltar ao carrinho">‹</Link><h1>Pagamento com carteira</h1></div>
    {purchase.isError && <p className="checkout-error" role="alert">{errorMessage(purchase.error)}</p>}
    {attempt ? <section className="state-panel" aria-label="Recuperação da tentativa"><h2>{purchase.isPending ? 'Enviando pedido…' : recovered.isFetching ? 'Recuperando pedido…' : 'Tentativa preservada'}</h2><p>A confirmação será exibida após a consulta do pedido à API.</p><Button disabled={purchase.isPending || recovered.isFetching} onClick={() => { if (!lock.current) { lock.current = true; purchase.mutate({ attempt, recovery: true }) } }}>Recuperar pedido</Button></section>
      : loading ? <div className="checkout-skeleton" role="status" aria-label="Carregando pagamento"><Skeleton /><Skeleton /><Skeleton /></div>
      : cart.isError ? <ErrorState error={cart.error} retry={() => { void cart.refetch() }} /> : wallets.query.isError ? <ErrorState error={wallets.query.error} retry={() => { void wallets.query.refetch() }} /> : quote.isError ? <ErrorState error={quote.error} retry={() => { void quote.refetch() }} /> : !cart.data?.items.length ? <div className="state-panel"><h2>Seu carrinho está vazio</h2><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>Explorar o mercado</Link></div> : quote.data && walletData && provider && <div className="checkout-layout">
        <section className="checkout-profile"><h2>Perfil do colecionador</h2><form id="collector-form" className="collector-form" noValidate onSubmit={submit}>{field('displayName', 'Nome de exibição')}{field('username', 'Nome de usuário')}<label>Rede<select aria-label="Rede" value={wallet?.networkId ?? (selectedId.startsWith('network:') ? selectedId.slice(8) : '')} onChange={(event) => { selectWallet(walletData.items.find((item) => item.networkId === event.target.value)?.id ?? `network:${event.target.value}`); review('') }}>{walletData.networks.map((network) => <option key={network.id} value={network.id}>{network.label}</option>)}</select></label>{field('profileName', 'Nome do perfil')}<label>Endereço da carteira<Input value={wallet?.address ?? ''} readOnly /></label>{field('ens', 'Nome ENS (opcional)', false)}{field('email', 'E-mail')}{field('referralCode', 'Código de indicação (opcional)', false)}<label className="collector-note">Observação do colecionador (opcional)<textarea value={collector.note} maxLength={500} onChange={(event) => { const next = { ...collector, note: event.target.value }; setCollector(next); setFields((previous) => { const remaining = { ...previous }; delete remaining.note; return remaining }); saveCollector(session.user.id, next); review('') }} /></label></form></section>
        <QuoteSummary quote={quote.data} />
        {!wallet && <p role="status" className="wallet-network-note">Selecione ou cadastre uma carteira na rede desejada.</p>}<WalletPanel session={session} state={wallets} selectedId={wallet?.id ?? ''} provider={provider} locked={purchase.isPending} onSelect={(id) => { selectWallet(id); review('') }} onProvider={(value) => { chooseProvider(value); review('') }} />
        <div className="checkout-actions"><p role="status">{quote.isFetching ? 'Atualizando cotação. Revise novamente os valores.' : !quote.data.valid ? 'Há itens indisponíveis. Corrija seu carrinho.' : 'Revise os itens, o desconto, a taxa e o total antes de confirmar.'}</p><label className="review-consent"><input type="checkbox" checked={reviewed === quote.data.id && !quote.isFetching} disabled={!quote.data.valid || quote.isFetching || !connected} onChange={(event) => review(event.target.checked ? quote.data!.id : '')} />Revisei os itens, os valores e as taxas desta cotação</label><Button type="submit" form="collector-form" disabled={!connected || !quote.data.valid || quote.isFetching || reviewed !== quote.data.id || purchase.isPending}>Confirmar compra</Button><Link to="/carrinho">Revisar carrinho ou cupom</Link></div>
      </div>}
  </div>
}
