import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Link, redirect, stripSearchParams } from '@tanstack/react-router'
import { catalogDefaults, normalizeCatalogSearch } from '@/features/catalog/search'
import { CatalogPage } from '@/features/catalog/page'
import { NftDetailPage } from '@/features/catalog/detail-page'
import { Shell } from './shell'
import { auth } from '@/features/auth/session'
import { safeReturnTo } from '@/features/auth/validation'
import { parseAppSearch, stringifyAppSearch } from './search'

const AuthPage = lazyRouteComponent(() => import('@/features/auth/page'), 'AuthPage')
const FavoritesPage = lazyRouteComponent(() => import('@/features/favorites/page'), 'FavoritesPage')
const CartPage = lazyRouteComponent(() => import('@/features/cart/page'), 'CartPage')
const CheckoutPage = lazyRouteComponent(() => import('@/features/checkout/page'), 'CheckoutPage')
const OrderPage = lazyRouteComponent(() => import('@/features/checkout/order-page'), 'OrderPage')
const ProfilePage = lazyRouteComponent(() => import('@/features/profile/page'), 'ProfilePage')
const WalletsPage = lazyRouteComponent(() => import('@/features/profile/wallets-page'), 'WalletsPage')

const rootRoute = createRootRoute({
  component: Shell,
  notFoundComponent: () => <div className="state-panel"><h1>Página não encontrada</h1><Link to="/" search={{ q: '', page: 1, sort: 'name' }}>Voltar ao mercado</Link></div>,
})

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: normalizeCatalogSearch,
  search: { middlewares: [stripSearchParams(catalogDefaults)] },
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

export const router = createRouter({ routeTree: rootRoute.addChildren([catalogRoute, detailRoute, loginRoute, registerRoute, favoritesRoute, cartRoute, checkoutRoute, orderRoute, profileRoute, walletsRoute]), parseSearch: parseAppSearch, stringifySearch: stringifyAppSearch, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
