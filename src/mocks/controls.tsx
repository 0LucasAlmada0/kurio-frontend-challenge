import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { http, errorMessage } from '@/api/http'
import { nftKeys } from '@/features/catalog/queries'
import { useLiveUpdates } from '@/realtime/provider'
import { Button } from '@/components/ui/button'
import { scenarioNames } from './scenarios'

export default function MockControls() {
  const queryClient = useQueryClient()
  const { connected } = useLiveUpdates()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function run(action: () => Promise<unknown>) {
    setPending(true)
    setError('')
    try { await action() } catch (cause) { setError(errorMessage(cause)) }
    finally { setPending(false) }
  }

  return <details className="mock-controls"><summary>Cenários de demonstração</summary><p>Ambiente simulado. A alteração abaixo é emitida via Socket.IO.</p><div className="mock-actions">
    <Button disabled={!connected || pending} onClick={() => { void run(() => http.post('/__mock/nfts/emerald-ape-042/update')) }}>Alterar Emerald Ape</Button>
    <Button variant="outline" disabled={pending} onClick={() => { void run(async () => { await http.post('/__mock/reset'); window.location.reload() }) }}>Restaurar cenário</Button>
    <label htmlFor="scenario">Resposta da API</label><select id="scenario" defaultValue="success" disabled={pending} onChange={(event) => { const scenario = event.target.value; void run(async () => { await http.post('/__mock/scenario', { scenario }); await queryClient.cancelQueries({ queryKey: nftKeys.all }); await queryClient.invalidateQueries({ queryKey: nftKeys.all }) }) }}>{scenarioNames.map((name) => <option key={name}>{name}</option>)}</select>
  </div>{error && <p role="alert">{error}</p>}</details>
}
