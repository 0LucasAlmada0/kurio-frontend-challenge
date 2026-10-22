import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { http, errorMessage } from '@/api/http'
import { nftKeys } from '@/features/catalog/queries'
import { useLiveUpdates } from '@/realtime/provider'
import { Button } from '@/components/ui/button'
import { scenarioNames } from './scenarios'
import { auth } from '@/features/auth/session'
import { getAuthScenario } from './auth-scenarios'
import { getCartScenario } from './cart-handlers'
import { isCartQuery } from '@/features/cart/queries'
import { checkoutPresets } from './checkout-scenarios'

export default function MockControls() {
  const queryClient = useQueryClient()
  const { connected } = useLiveUpdates()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [opened, setOpened] = useState(false)
  const authScenario = getAuthScenario()
  const selectedAuthScenario = authScenario.authFailure ? 'auth-error' : authScenario.accountFailure ? 'account-error' : authScenario.favoritesFailure ? 'favorite-error' : authScenario.privateDelay > 120 ? 'private-slow' : authScenario.mutationDelay > 350 ? 'mutation-slow' : 'success'

  async function run(action: () => Promise<unknown>) {
    setPending(true)
    setError('')
    try { await action() } catch (cause) { setError(errorMessage(cause)) }
    finally { setPending(false) }
  }

  return <details className="mock-controls" onToggle={(event) => { if (event.currentTarget.open) setOpened(true) }}><summary>Cenários de demonstração</summary>{opened && <><p>Ambiente simulado. A alteração abaixo é emitida via Socket.IO.</p><div className="mock-actions">
    <Button disabled={!connected || pending} onClick={() => { void run(() => http.post('/__mock/nfts/emerald-ape-042/update')) }}>Alterar Emerald Ape</Button>
    <Button variant="outline" disabled={pending} onClick={() => { void run(async () => { await http.post('/__mock/reset'); await auth.logout(); window.location.reload() }) }}>Restaurar cenário</Button>
    <Button variant="outline" disabled={pending} onClick={() => { void run(async () => { await http.post('/__mock/auth/expire'); await auth.restore() }) }}>Expirar sessão</Button>
    <label htmlFor="checkout-scenario">Checkout e pedidos</label><select id="checkout-scenario" defaultValue="success" disabled={pending} onChange={(event) => { const preset = event.target.value; void run(() => http.post('/__mock/checkout/scenario', { preset })) }}>{checkoutPresets.map((preset) => <option key={preset}>{preset}</option>)}</select>
    <Button variant="outline" disabled={pending} onClick={() => { void run(() => http.post('/__mock/checkout/resolve-pending', { status: 'confirmed' })) }}>Confirmar pendentes</Button>
    <Button variant="outline" disabled={pending} onClick={() => { void run(() => http.post('/__mock/checkout/resolve-pending', { status: 'refused' })) }}>Recusar pendentes</Button>
    <label htmlFor="cart-scenario">Carrinho e cotação</label><select id="cart-scenario" defaultValue={getCartScenario().failure !== 'none' ? getCartScenario().failure : getCartScenario().delay > 150 ? 'slow' : 'success'} disabled={pending} onChange={(event) => { const value = event.target.value; void run(async () => { await http.post('/__mock/cart/scenario', { failure: ['network', 'server'].includes(value) ? value : 'none', delay: value === 'slow' ? 1800 : value === 'timeout' ? 9000 : 150 }); await queryClient.invalidateQueries({ predicate: isCartQuery }) }) }}><option value="success">success</option><option value="server">server</option><option value="network">network</option><option value="slow">slow</option><option value="timeout">timeout</option></select>
    <label htmlFor="auth-scenario">Sessão e favoritos</label><select id="auth-scenario" defaultValue={selectedAuthScenario} disabled={pending} onChange={(event) => { const scenario = event.target.value; void run(() => http.post('/__mock/auth/scenario', { accountFailure: scenario === 'account-error', authFailure: scenario === 'auth-error', favoritesFailure: scenario === 'favorite-error', privateDelay: scenario === 'private-slow' ? 3_000 : 120, mutationDelay: scenario === 'favorite-error' || scenario === 'mutation-slow' ? 2_000 : 350 })) }}><option value="success">success</option><option value="auth-error">auth-error</option><option value="account-error">account-error</option><option value="favorite-error">favorite-error</option><option value="private-slow">private-slow</option><option value="mutation-slow">mutation-slow</option></select>
    <label htmlFor="scenario">Resposta da API</label><select id="scenario" defaultValue="success" disabled={pending} onChange={(event) => { const scenario = event.target.value; void run(async () => { await http.post('/__mock/scenario', { scenario }); await queryClient.cancelQueries({ queryKey: nftKeys.all }); await queryClient.invalidateQueries({ queryKey: nftKeys.all }) }) }}>{scenarioNames.map((name) => <option key={name}>{name}</option>)}</select>
  </div>{error && <p role="alert">{error}</p>}</>}</details>
}
