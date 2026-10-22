import { createRootRoute, createRoute, createRouter, Link, redirect } from '@tanstack/react-router'
import type { CatalogSearch } from '@/api/contracts'
import { CatalogPage } from '@/features/catalog/page'
import { NftDetailPage } from '@/features/catalog/detail-page'
import { Shell } from './shell'
import { AuthPage } from '@/features/auth/page'
import { auth } from '@/features/auth/session'
import { safeReturnTo } from '@/features/auth/validation'
import { FavoritesPage } from '@/features/favorites/page'
import { CartPage } from '@/features/cart/page'
import { CheckoutPage } from '@/features/checkout/page'
import { OrderPage } from '@/features/checkout/order-page'
import { ProfilePage } from '@/features/profile/page'
import { WalletsPage } from '@/features/profile/wallets-page'

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
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/carrinho', component: CartPage })

const authSearch = (search: Record<string, unknown>) => ({ redirect: safeReturnTo(search.redirect), reason: search.reason === 'expired' ? 'expired' : '' })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', validateSearch: authSearch, component: () => <AuthPage key="login" /> })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cadastro', validateSearch: authSearch, component: () => <AuthPage key="register" /> })
const requireAuth = async ({ location }: { location: { href: string } }) => {
  await auth.ready()
  const state = auth.getSnapshot()
  if (state.status === 'anonymous') throw redirect({ to: '/login', search: { redirect: location.href, reason: state.reason ?? '' }, replace: true })
}
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pagamento', beforeLoad: requireAuth, component: CheckoutPage })
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pedidos/$orderId', beforeLoad: requireAuth, component: OrderPage })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/perfil', beforeLoad: requireAuth, component: ProfilePage })
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/carteiras', beforeLoad: requireAuth, component: WalletsPage })
const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favoritos',
  beforeLoad: requireAuth,
  component: FavoritesPage,
})

export const router = createRouter({ routeTree: rootRoute.addChildren([catalogRoute, detailRoute, loginRoute, registerRoute, favoritesRoute, cartRoute, checkoutRoute, orderRoute, profileRoute, walletsRoute]), defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
