import { useMutation, useQuery, useQueryClient, useIsMutating } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Favorites } from '@/api/contracts'
import { auth } from '@/features/auth/session'
import { useAuth } from '@/features/auth/use-auth'
import { favoriteKeys, favoritesOptions } from './queries'

const pending = new Set<string>()

function membership(previous: Favorites | undefined, id: string, add: boolean) {
  if (!previous) return previous
  const ids = new Set(previous.nftIds)
  if (add) ids.add(id); else ids.delete(id)
  return { ...previous, nftIds: [...ids] }
}

export function useFavorite(nftId: string) {
  const { session, status } = useAuth()
  const client = useQueryClient()
  const key = session ? favoriteKeys.session(session) : ['private', 'guest', 'anonymous', 'favorites'] as const
  const mutationKey = [...key, nftId]
  const lock = `${session?.id}:${nftId}`
  const query = useQuery({ ...(session ? favoritesOptions(session) : { queryKey: key, queryFn: async (): Promise<Favorites> => { throw new Error('Sessão necessária.') } }), enabled: !!session })
  const count = useIsMutating({ mutationKey, exact: true })
  const mutation = useMutation({
    mutationKey,
    mutationFn: async (add: boolean) => {
      if (!session) throw new Error('Sessão necessária.')
      return auth.request<Favorites>(session, { method: add ? 'PUT' : 'DELETE', url: `/users/${session.user.id}/favorites/${encodeURIComponent(nftId)}` })
    },
    onMutate: async (add) => {
      await client.cancelQueries({ queryKey: key, exact: true })
      if (!session || !auth.isCurrent(session)) return
      const previous = client.getQueryData<Favorites>(key)?.nftIds.includes(nftId) ?? false
      client.setQueryData<Favorites>(key, (data) => membership(data, nftId, add))
      return { previous }
    },
    onError: (_error, _add, context) => {
      if (session && auth.isCurrent(session) && context) client.setQueryData<Favorites>(key, (data) => membership(data, nftId, context.previous))
    },
    onSuccess: (data) => {
      if (session && auth.isCurrent(session) && data.userId === session.user.id && data.sessionId === session.id) client.setQueryData<Favorites>(key, (previous) => membership(previous, nftId, data.nftIds.includes(nftId)))
    },
    onSettled: () => {
      pending.delete(lock)
      if (session && auth.isCurrent(session) && ![...pending].some((id) => id.startsWith(`${session.id}:`))) void client.invalidateQueries({ queryKey: key, exact: true })
    },
  })
  const reset = mutation.reset
  useEffect(() => { reset() }, [session?.id, reset])
  return {
    session,
    selected: !!session && (query.data?.nftIds.includes(nftId) ?? false),
    disabled: status === 'loading' || (!!session && (query.isPending || count > 0)),
    queryFailed: query.isError,
    error: session && auth.isCurrent(session) ? mutation.error ?? query.error : null,
    pending: count > 0,
    toggle: () => {
      if (!session || pending.has(lock) || !query.isSuccess) return
      pending.add(lock)
      mutation.mutate(!query.data.nftIds.includes(nftId))
    },
    retry: () => { void query.refetch() },
  }
}
