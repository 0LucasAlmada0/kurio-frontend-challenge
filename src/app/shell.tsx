import { Suspense, lazy } from 'react'
import { Link, Outlet } from '@tanstack/react-router'
import { LiveUpdatesProvider, useLiveUpdates } from '@/realtime/provider'

const MockControls = lazy(() => import('@/mocks/controls'))
const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true' || (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== 'false')

function LiveStatus() {
  const live = useLiveUpdates()
  return <div className="live-status"><span data-testid="socket-status">{live.connected ? '● Ao vivo' : '○ Reconectando'}</span><p role="status" aria-live="polite" data-testid="live-event" data-received={live.received}>{live.message}</p></div>
}

export function Shell() {
  return <LiveUpdatesProvider>
    <a className="skip-link" href="#main">Pular para conteúdo</a>
    <header className="site-header page-width">
      <Link className="brand" to="/" search={{ q: '', page: 1, sort: 'name' }}>KURIO</Link>
      <nav aria-label="Navegação principal"><Link to="/" search={{ q: '', page: 1, sort: 'name' }} activeProps={{ className: 'active' }}>Mercado</Link><a href="#about">Sobre a coleção</a></nav>
      <span className="demo-label">Marketplace demo</span>
    </header>
    <main id="main" className="page-width"><Outlet /><LiveStatus />{mocksEnabled && <Suspense><MockControls /></Suspense>}</main>
    <footer id="about" className="site-footer page-width"><span className="brand">KURIO</span><p>Feito para colecionadores,<br />criadores e cultura.</p><span>© 2026 Kurio · Ambiente de demonstração</span></footer>
    <nav className="mobile-nav" aria-label="Navegação mobile"><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>⌂ <span>Mercado</span></Link><a href="#about">◇ <span>Coleção</span></a></nav>
  </LiveUpdatesProvider>
}
