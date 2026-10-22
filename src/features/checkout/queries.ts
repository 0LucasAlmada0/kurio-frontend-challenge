import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session, WalletInput, WalletProvider, Wallets, Order } from '@/api/contracts'
import { auth } from '@/features/auth/session'

export const walletKey = (session: Session) => ['private', session.user.id, session.id, 'wallets'] as const
export const orderKeys = (session: Session) => ['private', session.user.id, session.id, 'orders'] as const
export function useWallets(session: Session) {
  const client = useQueryClient()
  const key = walletKey(session)
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => auth.request<Wallets>(session, { url: '/wallets', signal }) })
  const mutation = useMutation({
    mutationKey: [...key, 'write'],
    mutationFn: (action: { kind: 'add'; input: WalletInput } | { kind: 'update'; walletId: string; input: WalletInput } | { kind: 'connect'; walletId: string; provider: WalletProvider } | { kind: 'disconnect' }) => auth.request<Wallets>(session, action.kind === 'add' || action.kind === 'update' ? { url: action.kind === 'add' ? '/wallets' : `/wallets/${encodeURIComponent(action.walletId)}`, method: action.kind === 'add' ? 'POST' : 'PUT', data: action.input } : { url: '/wallets/connection', method: action.kind === 'disconnect' ? 'DELETE' : 'POST', data: action.kind === 'connect' ? { walletId: action.walletId, provider: action.provider } : undefined }),
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSuccess: (data) => { if (auth.isCurrent(session)) client.setQueryData(key, data) },
  })
  return { query, mutation }
}
export function useOrder(session: Session, id: string) {
  return useQuery({ queryKey: [...orderKeys(session), id], queryFn: ({ signal }) => auth.request<Order>(session, { url: `/orders/${encodeURIComponent(id)}`, signal }), refetchInterval: (query) => query.state.data?.status === 'pending' ? 1000 : false })
}
