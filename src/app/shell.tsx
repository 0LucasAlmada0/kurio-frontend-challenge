import { Suspense, lazy } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { LiveUpdatesProvider, useLiveUpdates } from '@/realtime/provider'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'

const MockControls = lazy(() => import('@/mocks/controls'))
const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true' || (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== 'false')

function LiveStatus() {
  const live = useLiveUpdates()
  return <div className="live-status"><span data-testid="socket-status">{live.connected ? '● Ao vivo' : '○ Reconectando'}</span><p role="status" aria-live="polite" data-testid="live-event" data-received={live.received}>{live.message}</p></div>
}

export function Shell() {
  const isDetail = useRouterState({ select: (state) => state.location.pathname.startsWith('/nfts/') })
  return <LiveUpdatesProvider>
    <div className={`app-shell${isDetail ? ' is-detail' : ''}`}>
    <a className="skip-link" href="#main">Pular para conteúdo</a>
    <header className="site-header page-width">
      <Link className="brand" to="/" search={{ q: '', page: 1, sort: 'name' }} activeProps={{ className: '' }}>KURIO</Link>
      <nav aria-label="Navegação principal"><Link to="/" search={{ q: '', page: 1, sort: 'name' }} activeProps={{ className: '' }} className={!isDetail ? 'active' : ''}>Início</Link><Link to="/" hash="catalog" search={{ q: '', page: 1, sort: 'name' }} activeProps={{ className: '' }} className={isDetail ? 'active' : ''}>Mercado</Link><button disabled title="Criadores · em breve">Criadores</button><button disabled title="Aprenda · em breve">Aprenda</button></nav>
      <div className="header-actions"><Link to="/" hash="search" search={(previous) => ({ q: previous.q ?? '', page: previous.page ?? 1, sort: previous.sort ?? 'name' })} aria-label="Ir para busca de NFTs" className="icon-button"><Icon name="search" /></Link><button className="icon-button" disabled aria-label="Carrinho · em breve" title="Carrinho · em breve"><Icon name="cart" /></button><Button className="login-button" disabled title="Autenticação em breve"><Icon name="login" />Entrar</Button></div>
    </header>
    <main id="main" className="page-width"><Outlet /><LiveStatus />{mocksEnabled && <Suspense><MockControls /></Suspense>}</main>
    <footer id="about" className="site-footer page-width"><span className="brand">KURIO</span><p>Feito para colecionadores,<br />criadores e cultura.</p><span>© 2026 Kurio · Ambiente de demonstração</span></footer>
    <nav className="mobile-nav" aria-label="Navegação mobile"><Link to="/" search={{ q: '', page: 1, sort: 'name' }} aria-label="Início"><Icon name="home" /></Link><button disabled aria-label="Favoritos · em breve" title="Favoritos · em breve"><Icon name="heart" /></button><button className="scan-button" disabled aria-label="Scanner · em breve" title="Scanner · em breve"><Icon name="scan" /></button><button disabled aria-label="Carrinho · em breve" title="Carrinho · em breve"><Icon name="cart" /></button><button disabled aria-label="Perfil · em breve" title="Perfil · em breve"><Icon name="user" /></button></nav>
    </div>
  </LiveUpdatesProvider>
}
