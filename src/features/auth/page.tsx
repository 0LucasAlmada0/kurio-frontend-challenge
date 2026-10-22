import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState, useSearch } from '@tanstack/react-router'
import axios from 'axios'
import type { ApiError, RegisterInput } from '@/api/contracts'
import { normalizeCatalogSearch } from '@/features/catalog/search'
import { errorMessage } from '@/api/http'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/icon'
import { CatalogPage } from '@/features/catalog/page'
import { NftDetailPage } from '@/features/catalog/detail-page'
import { CartPage } from '@/features/cart/page'
import { auth } from './session'
import { safeReturnTo, validateCredentials } from './validation'

export function AuthPage() {
  const path = useRouterState({ select: (state) => state.location.pathname })
  const search = useSearch({ strict: false })
  const register = path === '/cadastro'
  const returnTo = safeReturnTo(search.redirect)
  const navigate = useNavigate()
  const dialog = useRef<HTMLDialogElement>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState(false)
  const [values, setValues] = useState<RegisterInput>({ name: '', email: '', password: '', confirmPassword: '' })
  const active = useRef(true)
  const request = useRef(new AbortController())
  const mutation = useMutation({
    mutationFn: async () => { await auth.authenticate(register ? 'register' : 'login', register ? values : { email: values.email.trim(), password: values.password }, request.current.signal) },
    onSuccess: () => { if (active.current) void navigate({ href: returnTo, replace: true }) },
    onError: (error) => { if (active.current && axios.isAxiosError<ApiError>(error)) setFields(error.response?.data.fields ?? {}) },
  })
  useEffect(() => {
    active.current = true
    request.current = new AbortController()
    const previousFocus = document.activeElement as HTMLElement | null
    const element = dialog.current!
    element.showModal()
    element.querySelector('input')?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      active.current = false
      request.current.abort()
      element.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
      else document.getElementById('auth-trigger')?.focus()
    }
  }, [])
  function close() { auth.dismissExpiry(); void navigate({ href: returnTo, replace: true }) }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isPending) return
    const validation = validateCredentials(register ? values : { email: values.email.trim(), password: values.password })
    setFields(validation)
    if (!Object.keys(validation).length) mutation.mutate()
  }
  const target = new URL(returnTo, window.location.origin)
  const match = /^\/nfts\/([^/]+)$/.exec(target.pathname)
  const backgroundSearch = normalizeCatalogSearch(Object.fromEntries(target.searchParams))
  function input(field: keyof RegisterInput, label: string, type: string, autocomplete: string) {
    return <div className="auth-field"><label htmlFor={`auth-${field}`} className="sr-only">{label}</label><Input id={`auth-${field}`} name={field} type={type} autoComplete={autocomplete} placeholder={label} value={values[field]} aria-invalid={!!fields[field]} aria-describedby={fields[field] ? `error-${field}` : undefined} onChange={(event) => setValues({ ...values, [field]: event.target.value })} disabled={mutation.isPending} />{fields[field] && <p id={`error-${field}`} className="field-error">{fields[field]}</p>}</div>
  }
  return <>
    <div className="auth-background" aria-hidden="true" inert>{match ? <NftDetailPage nftId={decodeURIComponent(match[1]!)} /> : target.pathname === '/carrinho' ? <CartPage /> : <CatalogPage backgroundSearch={backgroundSearch} />}</div>
    <dialog ref={dialog} className={`auth-dialog${register ? ' register-dialog' : ''}`} aria-labelledby="auth-heading" onCancel={(event) => { event.preventDefault(); if (!mutation.isPending) close() }}>
      <button className="auth-close" aria-label="Fechar autenticação" disabled={mutation.isPending} onClick={close}>×</button>
      <div className="auth-mobile-brand" aria-hidden="true">KURIO</div>
      <div className="auth-tabs"><Link to="/login" search={{ redirect: returnTo, reason: search.reason ?? '' }} className={!register ? 'selected' : ''} activeProps={{ className: '' }}>Entrar</Link><span>|</span><Link to="/cadastro" search={{ redirect: returnTo, reason: search.reason ?? '' }} className={register ? 'selected' : ''} activeProps={{ className: '' }}>Criar conta</Link></div>
      <h1 id="auth-heading">{register ? 'Criar perfil de colecionador' : 'Entrar'}</h1>
      <p className="auth-intro">{register ? 'Crie seu perfil de colecionador e comece sua coleção.' : 'Entre para gerenciar sua coleção e seus favoritos.'}</p>
      {search.reason === 'expired' && <p role="status" className="auth-expired">Sua sessão expirou. Entre novamente para continuar.</p>}
      <form onSubmit={submit} noValidate aria-busy={mutation.isPending}>
        {register && input('name', 'Nome de usuário', 'text', 'nickname')}
        {input('email', 'E-mail', 'email', 'email')}
        <div className="password-field">{input('password', 'Senha', visible ? 'text' : 'password', register ? 'new-password' : 'current-password')}<button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible} onClick={() => setVisible(!visible)} disabled={mutation.isPending}><Icon name={visible ? 'eye' : 'eyeOff'} /></button></div>
        {register && input('confirmPassword', 'Confirmar senha', visible ? 'text' : 'password', 'new-password')}
        {!register && <button type="button" className="forgot-password" disabled title="Recuperação de senha ainda não disponível">Esqueceu a senha? · em breve</button>}
        {mutation.isError && <p role="alert" className="auth-error">{errorMessage(mutation.error)}</p>}
        {Object.keys(fields).length > 0 && !mutation.isError && <p className="sr-only" role="alert">Revise os campos indicados.</p>}
        <Button type="submit" className="auth-submit" disabled={mutation.isPending}>{mutation.isPending ? 'Aguarde…' : register ? 'Criar perfil' : 'Entrar'}</Button>
      </form>
      <div className="auth-divider">Ou continue com</div><div className="social-actions"><Button variant="outline" disabled>Continuar com Google</Button><Button variant="outline" disabled>Continuar com Facebook</Button><p>Login social indisponível nesta demonstração.</p></div>
      <p className="auth-mobile-switch">{register ? 'Já tem uma conta? ' : 'Novo na Kurio? '}<Link to={register ? '/login' : '/cadastro'} search={{ redirect: returnTo, reason: search.reason ?? '' }}>{register ? 'Entre' : 'Crie uma conta'}</Link></p>
    </dialog>
  </>
}
