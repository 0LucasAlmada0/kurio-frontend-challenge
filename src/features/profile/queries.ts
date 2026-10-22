import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Profile, ProfileUpdate, Session } from '@/api/contracts'
import { auth } from '@/features/auth/session'

export const profileKey = (session: Session) => ['private', session.user.id, session.id, 'profile'] as const
export function useProfile(session: Session) {
  const client = useQueryClient()
  const key = profileKey(session)
  const url = `/users/${encodeURIComponent(session.user.id)}/profile`
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => auth.request<Profile>(session, { url, signal }) })
  const save = useMutation({
    mutationKey: [...key, 'write'],
    mutationFn: async (input: ProfileUpdate) => {
      try { return await auth.request<Profile>(session, { url, method: 'PUT', data: input }) }
      finally { if (input.password) { input.password.currentPassword = ''; input.password.newPassword = ''; input.password.confirmPassword = ''; delete input.password } }
    },
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSuccess: (data) => {
      if (!auth.isCurrent(session)) return
      client.setQueryData(key, data)
      auth.updateUser(session, { id: data.userId, name: data.displayName, email: data.email })
    },
  })
  return { query, save }
}
