import { Suspense, lazy, useState } from 'react'
import { Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { LiveUpdatesProvider, useLiveUpdates } from '@/realtime/provider'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { AuthLifecycle } from '@/features/auth/lifecycle'
import { useAuth } from '@/features/auth/use-auth'
import { auth } from '@/features/auth/session'
import { errorMessage } from '@/api/http'
import { CartLink } from '@/features/cart/cart-link'

const MockControls = lazy(() => import('@/mocks/controls'))
const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true' || (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== 'false')

function LiveStatus() {
  const live = useLiveUpdates()
  return <div className="live-status"><span data-testid="socket-status">{live.connected ? '● Ao vivo' : '○ Reconectando'}</span><p role="status" aria-live="polite" data-testid="live-event" data-received={live.received}>{live.message}</p></div>
}

export function Shell() {
  const isDetail = useRouterState({ select: (state) => state.location.pathname.startsWith('/nfts/') || (['/login', '/cadastro'].includes(state.location.pathname) && typeof state.location.search.redirect === 'string' && state.location.search.redirect.startsWith('/nfts/')) })
  const isCart = useRouterState({ select: (state) => state.location.pathname === '/carrinho' })
  const isPurchase = useRouterState({ select: (state) => state.location.pathname === '/pagamento' || state.location.pathname.startsWith('/pedidos/') })
  const isAuth = useRouterState({ select: (state) => ['/login', '/cadastro'].includes(state.location.pathname) })
  const state = useAuth()
  const router = useRouter()
  const [accountOpen, setAccountOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  function login() { void router.navigate({ to: '/login', search: { redirect: router.state.location.href, reason: '' } }) }
  async function logout() {
    setAccountOpen(false)
    setLogoutError('')
    try { await auth.logout() } catch (error) { if (!auth.getSnapshot().session) setLogoutError(errorMessage(error)) }
  }
  return <LiveUpdatesProvider>
    <AuthLifecycle />
    <div className={`app-shell${isDetail ? ' is-detail' : ''}${isAuth ? ' is-auth' : ''}${isPurchase ? ' is-purchase' : ''}`}>
    <a className="skip-link" href="#main">Pular para conteúdo</a>
    <header className="site-header page-width">
      <Link className="brand" to="/" search={{ q: '', page: 1, sort: 'name' }} activeProps={{ className: '' }}>KURIO</Link>
      <nav aria-label="Navegação principal"><Link to="/" search={{ q: '', page: 1, sort: 'name' }} activeProps={{ className: '' }} className={!isDetail && !isCart && !isPurchase ? 'active' : ''}>Início</Link><Link to="/" hash="catalog" search={{ q: '', page: 1, sort: 'name' }} activeProps={{ className: '' }} className={isDetail || isCart || isPurchase ? 'active' : ''}>Mercado</Link><button disabled title="Criadores · em breve">Criadores</button><button disabled title="Aprenda · em breve">Aprenda</button></nav>
      <div className="header-actions"><Link to="/" hash="search" search={(previous) => ({ q: previous.q ?? '', page: previous.page ?? 1, sort: previous.sort ?? 'name' })} aria-label="Ir para busca de NFTs" className="icon-button"><Icon name="search" /></Link><Link to="/favoritos" aria-label="Seus favoritos" className="icon-button"><Icon name="heart" /></Link><CartLink />{state.session ? <div className="account-actions"><Link to="/favoritos" aria-label={`Favoritos de ${state.session.user.name}`}><span>{state.session.user.name}</span></Link><button onClick={() => { void logout() }}>Sair</button></div> : <Button id="auth-trigger" className="login-button" disabled={state.status === 'loading'} onClick={login}><Icon name="login" />Entrar</Button>}</div>
    </header>
    <main id="main" className="page-width">{state.status === 'error' && <div className="session-error" role="alert">Não foi possível recuperar sua sessão. <Button variant="outline" onClick={() => { void auth.restore() }}>Tentar novamente</Button></div>}{logoutError && <p role="alert">{logoutError}</p>}<Outlet /><LiveStatus />{mocksEnabled && <Suspense><MockControls /></Suspense>}</main>
    <footer id="about" className="site-footer page-width"><span className="brand">KURIO</span><p>Feito para colecionadores,<br />criadores e cultura.</p><span>© 2026 Kurio · Ambiente de demonstração</span></footer>
    <nav className="mobile-nav" aria-label="Navegação mobile"><Link to="/" search={{ q: '', page: 1, sort: 'name' }} aria-label="Início"><Icon name="home" /></Link><Link to="/favoritos" aria-label="Seus favoritos"><Icon name="heart" /></Link><button className="scan-button" disabled aria-label="Scanner · em breve" title="Scanner · em breve"><Icon name="scan" /></button><CartLink /><button aria-label={state.session ? `Conta de ${state.session.user.name}` : 'Entrar'} disabled={state.status === 'loading'} aria-expanded={!!state.session && accountOpen} onClick={() => { if (state.session) setAccountOpen(!accountOpen); else login() }}><Icon name="user" /></button>{state.session && accountOpen && <div className="mobile-account"><p>{state.session.user.name}</p><Link to="/favoritos" onClick={() => setAccountOpen(false)}>Seus favoritos</Link><button onClick={() => { void logout() }}>Sair</button></div>}</nav>
    </div>
  </LiveUpdatesProvider>
}
