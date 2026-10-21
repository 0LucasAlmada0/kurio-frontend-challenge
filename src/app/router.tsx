import { createRootRoute, createRoute, createRouter, Link } from '@tanstack/react-router'
import type { CatalogSearch } from '@/api/contracts'
import { CatalogPage } from '@/features/catalog/page'
import { NftDetailPage } from '@/features/catalog/detail-page'
import { Shell } from './shell'

const rootRoute = createRootRoute({
  component: Shell,
  notFoundComponent: () => <div className="state-panel"><h1>Página não encontrada</h1><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>Voltar ao mercado</Link></div>,
})

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search.q === 'string' ? search.q.slice(0, 120) : '',
    page: Number.isSafeInteger(Number(search.page)) && Number(search.page) > 0 ? Number(search.page) : 1,
    sort: search.sort === 'price-asc' || search.sort === 'price-desc' ? search.sort : 'name',
  }),
  component: CatalogPage,
})

const detailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/nfts/$nftId', component: NftDetailPage })

export const router = createRouter({ routeTree: rootRoute.addChildren([catalogRoute, detailRoute]), defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
