import { useMutationState, useQueries, useQuery } from '@tanstack/react-query'
import type { Session } from '@/api/contracts'
import { auth } from '@/features/auth/session'
import { useAuth } from '@/features/auth/use-auth'
import { nftOptions } from '@/features/catalog/queries'
import { CatalogLoading } from '@/components/loading'
import { NFTCard } from '@/components/nft-card'
import { ErrorState } from '@/components/error-state'
import { favoriteKeys, favoritesOptions } from './queries'
import { errorMessage } from '@/api/http'

function FavoritesContent({ session }: { session: Session }) {
  const query = useQuery(favoritesOptions(session))
  const nfts = useQueries({ queries: (query.data?.nftIds ?? []).map(nftOptions) })
  const mutationError = useMutationState({ filters: { mutationKey: favoriteKeys.session(session) }, select: (mutation) => mutation.state.status === 'error' ? mutation.state.error : null }).at(-1)
  return <section className="favorites-page"><h1>Seus favoritos</h1><p className="favorites-owner" data-testid="favorites-owner">Coleção de {session.user.name}</p>
    {mutationError && <p role="alert" className="auth-error">{errorMessage(mutationError)}</p>}
    {query.isError ? <ErrorState error={query.error} retry={() => { void query.refetch() }} /> : query.isPending || nfts.some((nft) => nft.isPending) ? <CatalogLoading /> : !query.data.nftIds.length ? <div className="state-panel" role="status">Você ainda não tem favoritos.</div> : <div className="nft-grid">{nfts.map((result, index) => result.data ? <NFTCard key={result.data.id} nft={result.data} index={index} /> : <ErrorState key={index} error={result.error} retry={() => { void result.refetch() }} />)}</div>}
  </section>
}

export function FavoritesPage() {
  const state = useAuth()
  if (state.status === 'error') return <ErrorState error={state.error} retry={() => { void auth.restore() }} />
  return state.session ? <FavoritesContent key={state.session.id} session={state.session} /> : <CatalogLoading />
}
