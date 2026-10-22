import { queryOptions } from '@tanstack/react-query'
import type { Favorites, Session } from '@/api/contracts'
import { privateKeys } from '@/app/query-client'
import { auth } from '@/features/auth/session'

export const favoriteKeys = {
  session: (session: Session) => [...privateKeys.user(session.user.id), session.id, 'favorites'] as const,
}

export function favoritesOptions(session: Session) {
  return queryOptions({
    queryKey: favoriteKeys.session(session),
    queryFn: async ({ signal }) => {
      const data = await auth.request<Favorites>(session, { url: `/users/${session.user.id}/favorites`, signal })
      if (data.userId !== session.user.id || data.sessionId !== session.id) throw new Error('Identidade da resposta privada inválida.')
      return data
    },
    retry: false,
  })
}
