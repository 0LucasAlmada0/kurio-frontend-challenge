import { useRef, useState, type FormEvent } from 'react'
import axios from 'axios'
import type { ApiError, PasswordChange, Profile, ProfileInput, Session } from '@/api/contracts'
import { errorMessage } from '@/api/http'
import { useAuth } from '@/features/auth/use-auth'
import { auth } from '@/features/auth/session'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/error-state'
import { Icon } from '@/components/icon'
import { AccountLayout } from './layout'
import { useProfile } from './queries'
import { avatarError, validateProfile } from './validation'

export function ProfilePage() {
  const { session } = useAuth()
  return session ? <AccountLayout><ProfileContent key={session.id} session={session} /></AccountLayout> : <p role="status">Recuperando sessão…</p>
}
function ProfileContent({ session }: { session: Session }) {
  const state = useProfile(session)
  return <><h1>Perfil do colecionador</h1>{state.query.isPending ? <div className="account-skeleton" role="status" aria-label="Carregando perfil"><Skeleton className="h-60" /><Skeleton className="h-60" /></div> : state.query.isError ? <ErrorState error={state.query.error} retry={() => { void state.query.refetch() }} /> : <ProfileForm key={state.query.data.version} profile={state.query.data} state={state} session={session} />}</>
}
function ProfileForm({ profile, state, session }: { profile: Profile; state: ReturnType<typeof useProfile>; session: Session }) {
  const [values, setValues] = useState<ProfileInput>(profile)
  const [password, setPassword] = useState<PasswordChange>({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [fields, setFields] = useState<Record<string, string>>({})
  const [fileError, setFileError] = useState('')
  const [reading, setReading] = useState(false)
  const [changed, setChanged] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const errors: Record<string, string> = { ...fields, ...(axios.isAxiosError<ApiError>(state.save.error) ? state.save.error.response?.data.fields : {}), ...(fileError ? { avatar: fileError } : {}) }
  const locked = reading || state.save.isPending
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked) return
    const input = { ...values, version: profile.version, ...(Object.values(password).some(Boolean) ? { password: { ...password } } : {}) }
    const errors = { ...validateProfile(input), ...(fileError ? { avatar: fileError } : {}) }
    setFields(errors)
    if (Object.keys(errors).length) { const form = event.currentTarget; requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return }
    state.save.mutate(input, { onSuccess: () => { if (auth.isCurrent(session)) requestAnimationFrame(() => document.getElementById('profile-save')?.focus()) } })
  }
  async function avatar(image?: File) {
    if (!image || locked) return
    const error = avatarError(image.type, image.size)
    setFileError(error)
    if (error) return
    setReading(true)
    try {
      const bitmap = await createImageBitmap(image); bitmap.close()
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(image) })
      if (auth.isCurrent(session)) { setValues((current) => ({ ...current, avatar: data })); setChanged(true) }
    } catch { setFileError('A imagem está corrompida ou não é compatível.') }
    finally { setReading(false); if (file.current) file.current.value = '' }
  }
  function field(name: Exclude<keyof ProfileInput, 'avatar'>, label: string, required = false) {
    return <div className="account-field"><label htmlFor={`profile-${name}`}>{label}{required && <span className="required-mark"> *</span>}</label><Input id={`profile-${name}`} type={name === 'email' ? 'email' : 'text'} value={values[name]} maxLength={name === 'email' ? 254 : name === 'ens' ? 120 : 60} autoComplete={name === 'email' ? 'email' : name === 'username' ? 'username' : 'off'} aria-required={required} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `profile-${name}-error` : undefined} onChange={(event) => { state.save.reset(); setValues({ ...values, [name]: event.target.value }); setChanged(true) }} />{errors[name] && <p id={`profile-${name}-error`} role="alert">{errors[name]}</p>}</div>
  }
  return <form className="profile-form" noValidate onSubmit={submit} aria-busy={locked}><fieldset disabled={locked}><legend className="sr-only">Dados do perfil</legend><div className="account-form-grid">
    {field('displayName', 'Nome de exibição', true)}{field('username', 'Nome de usuário', true)}{field('email', 'E-mail', true)}{field('ens', 'Nome ENS (opcional)')}{field('walletAlias', 'Apelido da carteira (público)')}
    <div className="account-field"><span>Avatar</span><div className="avatar-actions"><div className="profile-avatar">{values.avatar ? <img src={values.avatar} alt="Avatar do colecionador" /> : <Icon name="image" />}</div><Button type="button" aria-invalid={!!errors.avatar} aria-describedby="avatar-help avatar-error" onClick={() => file.current?.click()}>Alterar</Button><Button type="button" variant="ghost" disabled={!values.avatar} onClick={() => { setValues({ ...values, avatar: null }); setFileError(''); setChanged(true); state.save.reset() }}>Remover</Button></div><input className="avatar-file" ref={file} tabIndex={-1} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Arquivo do avatar" aria-invalid={!!errors.avatar} aria-describedby="avatar-help avatar-error" disabled={locked} onChange={(event) => { void avatar(event.target.files?.[0]) }} /><small id="avatar-help">PNG, JPEG ou WebP · até 512 KB. Confirme em Salvar.</small><p id="avatar-error" role={errors.avatar ? 'alert' : undefined}>{errors.avatar}</p></div>
  </div><section className="password-change" aria-labelledby="password-title"><h2 id="password-title">Alterar senha</h2>{(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((name, index) => <div className="account-field" key={name}><label htmlFor={`profile-${name}`}>{['Senha atual', 'Nova senha', 'Confirmar nova senha'][index]}</label><div className="password-control"><Input id={`profile-${name}`} type={visible[name] ? 'text' : 'password'} autoComplete={index ? 'new-password' : 'current-password'} maxLength={128} value={password[name]} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `profile-${name}-error` : undefined} onChange={(event) => { state.save.reset(); setPassword({ ...password, [name]: event.target.value }); setChanged(true) }} /><button type="button" aria-label={`${visible[name] ? 'Ocultar' : 'Mostrar'} ${['senha atual', 'nova senha', 'confirmação da senha'][index]}`} aria-pressed={!!visible[name]} onClick={() => setVisible({ ...visible, [name]: !visible[name] })}><Icon name={visible[name] ? 'eye' : 'eyeOff'} /></button></div>{errors[name] && <p id={`profile-${name}-error`} role="alert">{errors[name]}</p>}</div>)}</section></fieldset>
    {state.save.isError && <p role="alert">{errorMessage(state.save.error)}</p>}{state.save.isError && axios.isAxiosError<ApiError>(state.save.error) && state.save.error.response?.data.code === 'PROFILE_STALE' && <Button type="button" variant="outline" onClick={() => { state.save.reset(); void state.query.refetch() }}>Recarregar dados</Button>}
    {state.save.isSuccess && <p role="status">Perfil salvo com sucesso.</p>}{changed && !state.save.isSuccess && <p className="account-note">Alterações ainda não salvas.</p>}
    <Button id="profile-save" type="submit" className="account-save" disabled={locked}>{reading ? 'Lendo imagem…' : state.save.isPending ? 'Salvando…' : 'Salvar'}</Button>
  </form>
}
