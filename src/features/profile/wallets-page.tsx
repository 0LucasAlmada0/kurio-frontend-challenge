import { useState } from 'react'
import type { Session } from '@/api/contracts'
import { useAuth } from '@/features/auth/use-auth'
import { useWallets } from '@/features/checkout/queries'
import { WalletForm } from '@/features/checkout/wallet-panel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/error-state'
import { errorMessage } from '@/api/http'
import { AccountLayout } from './layout'

export function WalletsPage() {
  const { session } = useAuth()
  return session ? <AccountLayout><WalletsContent key={session.id} session={session} /></AccountLayout> : <p role="status">Recuperando sessão…</p>
}
function WalletsContent({ session }: { session: Session }) {
  const state = useWallets(session)
  const [editing, setEditing] = useState('')
  const data = state.query.data
  if (state.query.isPending) return <div className="account-skeleton" role="status" aria-label="Carregando carteiras"><Skeleton className="h-60" /><Skeleton className="h-60" /></div>
  if (state.query.isError || !data) return <ErrorState error={state.query.error} retry={() => { void state.query.refetch() }} />
  const primary = data.items.find((wallet) => wallet.kind === 'primary')
  const secondary = data.items.filter((wallet) => wallet.kind === 'secondary')
  const selected = secondary.find((wallet) => wallet.id === editing)
  const defaults = { displayName: session.user.name, profileName: session.user.name, email: session.user.email }
  return <div className="wallet-management"><div className="account-title"><h1>Carteira principal</h1><button disabled={state.mutation.isPending} onClick={() => { state.mutation.reset(); setEditing(editing === 'new-primary' ? '' : 'new-primary') }}>{editing === 'new-primary' ? 'Cancelar adição' : 'Adicionar'}</button></div><p className="account-description">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
    <WalletForm key={editing === 'new-primary' ? editing : JSON.stringify(primary)} data={data} state={state} wallet={editing === 'new-primary' ? undefined : primary} kind="primary" expanded defaults={defaults} onSaved={() => setEditing('')} />
    <section className="secondary-wallets" aria-labelledby="secondary-title"><div className="account-title"><h2 id="secondary-title">Carteira secundária</h2><button disabled={state.mutation.isPending} onClick={() => { state.mutation.reset(); setEditing(editing === 'new-secondary' ? '' : 'new-secondary') }}>{editing === 'new-secondary' ? 'Cancelar adição' : 'Adicionar secundária'}</button></div>
      {!secondary.length && <p className="account-description">Você ainda não adicionou uma carteira secundária.</p>}
      <ul className="wallet-list">{secondary.map((wallet) => <li key={wallet.id}><div><strong>{wallet.label}</strong><span>{data.networks.find((network) => network.id === wallet.networkId)?.label}</span><span className="wallet-address" title={wallet.address}>{wallet.address}</span></div><div className="wallet-list-actions"><Button variant="ghost" disabled={state.mutation.isPending} onClick={() => { state.mutation.reset(); setEditing(wallet.id) }}>Editar {wallet.label}</Button><Button variant="outline" disabled={state.mutation.isPending} onClick={() => state.mutation.mutate({ kind: 'update', walletId: wallet.id, input: { ...wallet, kind: 'primary' } })}>Definir {wallet.label} como principal</Button></div></li>)}</ul>
      {(selected || editing === 'new-secondary') && <WalletForm key={selected ? JSON.stringify(selected) : editing} data={data} state={state} wallet={selected} kind="secondary" expanded defaults={defaults} onSaved={() => setEditing('')} />}
    </section>{state.mutation.isError && <p role="alert">{errorMessage(state.mutation.error)}</p>}{state.mutation.isSuccess && <p role="status">Carteira salva com sucesso.</p>}
  </div>
}
