import { useId, useState } from 'react'
import axios from 'axios'
import type { ApiError, Session, WalletInput, WalletProvider, Wallets } from '@/api/contracts'
import { errorMessage } from '@/api/http'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateWallet } from './validation'
import { useWallets } from './queries'

type WalletState = ReturnType<typeof useWallets>
export function WalletForm({ data, state }: { data: Wallets; state: WalletState }) {
  const id = useId()
  const [values, setValues] = useState<WalletInput>({ label: '', address: '', networkId: data.networks[0]!.id, kind: 'secondary' })
  const [fields, setFields] = useState<Record<string, string>>({})
  const errors = { ...fields, ...(state.mutation.isError && axios.isAxiosError<ApiError>(state.mutation.error) ? state.mutation.error.response?.data.fields : {}) }
  return <form className="wallet-form" noValidate onSubmit={(event) => { event.preventDefault(); const errors = validateWallet(values); setFields(errors); if (!Object.keys(errors).length && !state.mutation.isPending) state.mutation.mutate({ kind: 'add', input: values }) }}>
    <label>Apelido da carteira<Input value={values.label} maxLength={60} aria-invalid={!!errors.label} aria-describedby={errors.label ? `${id}-label` : undefined} onChange={(event) => setValues({ ...values, label: event.target.value })} /></label>{errors.label && <p id={`${id}-label`} role="alert">{errors.label}</p>}
    <label>Endereço da carteira<Input value={values.address} placeholder="0x… ou nome.eth" maxLength={120} aria-invalid={!!errors.address} aria-describedby={errors.address ? `${id}-address` : undefined} onChange={(event) => setValues({ ...values, address: event.target.value })} /></label>{errors.address && <p id={`${id}-address`} role="alert">{errors.address}</p>}
    <label>Rede da nova carteira<select value={values.networkId} aria-invalid={!!errors.networkId} aria-describedby={errors.networkId ? `${id}-network` : undefined} onChange={(event) => setValues({ ...values, networkId: event.target.value as WalletInput['networkId'] })}>{data.networks.map((network) => <option key={network.id} value={network.id}>{network.label}</option>)}</select></label>{errors.networkId && <p id={`${id}-network`} role="alert">{errors.networkId}</p>}
    <label>Tipo da carteira<select value={values.kind} aria-invalid={!!errors.kind} aria-describedby={errors.kind ? `${id}-kind` : undefined} onChange={(event) => setValues({ ...values, kind: event.target.value as WalletInput['kind'] })}><option value="primary">Principal</option><option value="secondary">Secundária</option></select></label>{errors.kind && <p id={`${id}-kind`} role="alert">{errors.kind}</p>}
    <Button type="submit" disabled={state.mutation.isPending}>{state.mutation.isPending ? 'Salvando…' : 'Salvar carteira'}</Button>
  </form>
}
export function WalletPanel({ state, selectedId, provider, onSelect, onProvider, locked }: { session: Session; state: WalletState; selectedId: string; provider: WalletProvider; onSelect: (id: string) => void; onProvider: (provider: WalletProvider) => void; locked: boolean }) {
  const data = state.query.data!
  const connected = data.connection?.walletId === selectedId && data.connection.provider === provider
  return <section className="wallet-panel" aria-labelledby="wallet-heading"><h2 id="wallet-heading">{connected ? 'Carteira conectada' : 'Selecione uma carteira'}</h2><p className="simulation-note">Conexão e pagamento simulados.</p>
    <fieldset disabled={locked || state.mutation.isPending} className="wallet-options"><legend className="sr-only">Carteiras cadastradas</legend>{data.items.map((wallet) => <label className="wallet-option" key={wallet.id}><input type="radio" name="wallet" value={wallet.id} checked={selectedId === wallet.id} onChange={() => onSelect(wallet.id)} /><span><strong>{wallet.label}</strong><span className="wallet-address" title={wallet.address}>{wallet.address}</span><span>{data.networks.find((network) => network.id === wallet.networkId)?.label}</span><small>{wallet.kind === 'primary' ? 'Principal' : 'Secundária'}</small></span></label>)}</fieldset>
    {!data.items.length && <p>Nenhuma carteira cadastrada.</p>}
    <fieldset disabled={locked || state.mutation.isPending} className="provider-options"><legend>Carteira e rede</legend>{data.providers.map((value) => <label key={value}><span aria-hidden="true" className="provider-symbol">{value[0]}</span><span>{value}</span><input type="radio" name="provider" checked={provider === value} onChange={() => onProvider(value)} /></label>)}</fieldset>
    <Button variant="outline" disabled={!selectedId || locked || state.mutation.isPending} onClick={() => state.mutation.mutate(connected ? { kind: 'disconnect' } : { kind: 'connect', walletId: selectedId, provider })}>{state.mutation.isPending ? 'Aguarde…' : connected ? 'Desconectar carteira' : 'Conectar carteira simulada'}</Button>
    {connected && <p role="status">Carteira conectada nesta sessão.</p>}{state.mutation.isError && <p role="alert">{errorMessage(state.mutation.error)}</p>}
    <details className="wallet-registration"><summary>Cadastrar carteira</summary><WalletForm data={data} state={state} /></details>
  </section>
}
