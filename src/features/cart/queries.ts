import { CanceledError, type AxiosRequestConfig } from 'axios'
import { useEffect } from 'react'
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cart, CartItemInput, Quote } from '@/api/contracts'
import { http } from '@/api/http'
import { auth } from '@/features/auth/session'
import { useAuth } from '@/features/auth/use-auth'
import { guestCart } from './identity'

const locks = new Set<string>()
export const isCartQuery = (query: { queryKey: readonly unknown[] }) => query.queryKey.includes('cart')
type Change = { kind: 'item'; input: CartItemInput } | { kind: 'remove'; nftId: string; editionId: string } | { kind: 'coupon'; code: string | null }

export function useCart(withQuote = false) {
  const state = useAuth()
  const session = state.session
  const ownerId = session?.user.id ?? guestCart.id()
  const identity = session?.id ?? ownerId
  const key = session ? ['private', ownerId, session.id, 'cart'] : ['visitor', ownerId, 'cart']
  const enabled = state.status === 'authenticated' || state.status === 'anonymous'
  const current = () => session ? auth.isCurrent(session) : auth.getSnapshot().status === 'anonymous' && guestCart.id() === ownerId
  const client = useQueryClient()
  async function request<T>(config: AxiosRequestConfig): Promise<T> {
    if (!current()) throw new CanceledError('Carrinho de uma identidade anterior.')
    const result = session ? await auth.request<T>(session, config) : (await http.request<T>({ ...config, headers: { 'X-Guest-Cart': ownerId }, signal: AbortSignal.any([guestCart.signal(), ...(config.signal ? [config.signal as AbortSignal] : [])]) })).data
    if (!current()) throw new CanceledError('Resposta de um carrinho anterior.')
    if ((result as Cart).ownerId !== ownerId) throw new CanceledError('Proprietário inválido.')
    return result
  }
  const cart = useQuery({ queryKey: key, enabled, queryFn: ({ signal }) => request<Cart>({ url: '/cart', signal }) })
  const quote = useQuery({ queryKey: [...key, 'quote', cart.data?.version], enabled: withQuote && enabled && !!cart.data, queryFn: ({ signal }) => request<Quote>({ url: '/cart/quote', signal }), placeholderData: (previous) => previous?.ownerId === ownerId ? previous : undefined, staleTime: 0, refetchInterval: withQuote ? 30_000 : false })
  const pending = useIsMutating({ mutationKey: [...key, 'write'] }) > 0
  const change = useMutation({
    mutationKey: [...key, 'write'],
    mutationFn: async (action: Change) => {
      if (locks.has(identity)) throw new Error('Aguarde a alteração em andamento.')
      locks.add(identity)
      try {
        await client.cancelQueries({ queryKey: key })
        if (action.kind === 'item') return await request<Cart>({ url: '/cart/items', method: 'PUT', data: action.input })
        if (action.kind === 'remove') return await request<Cart>({ url: `/cart/items/${encodeURIComponent(action.nftId)}/${encodeURIComponent(action.editionId)}`, method: 'DELETE' })
        return await request<Cart>({ url: '/cart/coupon', method: action.code === null ? 'DELETE' : 'PUT', data: action.code === null ? undefined : { code: action.code } })
      } finally { locks.delete(identity) }
    },
    onSuccess: async (data) => {
      if (!current()) return
      client.setQueryData(key, data)
      await client.invalidateQueries({ queryKey: key })
    },
  })
  const reset = change.reset
  useEffect(() => { reset() }, [identity, reset])
  return { cart, quote, change, pending, enabled, identity }
}
