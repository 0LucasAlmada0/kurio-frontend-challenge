import { useId, useState } from 'react'
import axios from 'axios'
import type { ApiError, Session, Wallet, WalletInput, WalletProvider, Wallets } from '@/api/contracts'
import { errorMessage } from '@/api/http'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateWallet } from './validation'
import { useWallets } from './queries'

type WalletState = ReturnType<typeof useWallets>
export function WalletForm({ data, state, wallet, expanded = false, kind = 'secondary', defaults, onSaved }: { data: Wallets; state: WalletState; wallet?: Wallet; expanded?: boolean; kind?: WalletInput['kind']; defaults?: Partial<WalletInput>; onSaved?: () => void }) {
  const id = useId()
  const [values, setValues] = useState<WalletInput>({ label: '', address: '', networkId: data.networks[0]!.id, kind, ...defaults, ...wallet })
  const [fields, setFields] = useState<Record<string, string>>({})
  const action = state.mutation.variables
  const ownError = state.mutation.isError && action && 'input' in action && action.input === values ? state.mutation.error : null
  const errors = { ...fields, ...(axios.isAxiosError<ApiError>(ownError) ? ownError.response?.data.fields : {}) }
  function field(name: keyof WalletInput, label: string) {
    const props = { id: `${id}-${name}`, value: values[name] ?? '', 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined, onChange: (event: { target: { value: string } }) => { state.mutation.reset(); setValues({ ...values, [name]: event.target.value }) } }
    return <div className="account-field" key={name}><label htmlFor={props.id}>{label}</label>{name === 'networkId' ? <select {...props}>{data.networks.map((network) => <option key={network.id} value={network.id}>{network.label}</option>)}</select> : name === 'kind' ? <select {...props}><option value="primary">Principal</option><option value="secondary">Secundária</option></select> : <Input {...props} type={name === 'email' ? 'email' : 'text'} placeholder={name === 'address' ? '0x… ou nome.eth' : undefined} maxLength={name === 'email' ? 254 : ['address', 'ens', 'secondaryAddress'].includes(name) ? 120 : name === 'referralCode' ? 32 : 60} />}{errors[name] && <p id={`${id}-${name}-error`} role="alert">{errors[name]}</p>}</div>
  }
  return <form className={`wallet-form${expanded ? ' wallet-form-expanded' : ''}`} aria-label={wallet ? `Editar carteira ${wallet.label}` : 'Cadastrar carteira'} noValidate onSubmit={(event) => { event.preventDefault(); const errors = validateWallet(values); setFields(errors); if (!Object.keys(errors).length && !state.mutation.isPending) state.mutation.mutate(wallet ? { kind: 'update', walletId: wallet.id, input: values } : { kind: 'add', input: values }, { onSuccess: onSaved }); else { const form = event.currentTarget; requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()) } }}>
    <fieldset disabled={state.mutation.isPending}><legend className="sr-only">Dados da carteira</legend><div className={expanded ? 'account-form-grid' : undefined}>
    {(expanded ? ([['displayName', 'Nome de exibição (opcional)'], ['label', 'Apelido da carteira'], ['networkId', 'Rede da nova carteira'], ['profileName', 'Nome do perfil (opcional)'], ['address', 'Endereço da carteira'], ['secondaryAddress', 'ENS ou carteira secundária (opcional)'], ['kind', 'Tipo da carteira'], ['referralCode', 'Código de indicação (opcional)'], ['email', 'E-mail (opcional)'], ['ens', 'Nome ENS (opcional)']] as const) : ([['label', 'Apelido da carteira'], ['address', 'Endereço da carteira'], ['networkId', 'Rede da nova carteira'], ['kind', 'Tipo da carteira']] as const)).map(([name, label]) => field(name, label))}
    </div></fieldset>
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
