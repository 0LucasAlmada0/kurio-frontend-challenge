import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Nft, NftList, Order } from '@/api/contracts'
import { nftKeys } from '@/features/catalog/queries'
import { createSocket } from './client'
import { isNftUpdated, isOrderUpdated } from './events'
import { isCartQuery } from '@/features/cart/queries'
import { auth } from '@/features/auth/session'
import { useAuth } from '@/features/auth/use-auth'

const LiveContext = createContext({ connected: false, message: '', received: 0, orderReceived: 0, orderMessage: '' })

export function LiveUpdatesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState({ connected: false, message: '', received: 0, orderReceived: 0, orderMessage: '', orderSessionId: '' })
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null)
  const session = useAuth().session

  useEffect(() => {
    const socket = createSocket()
    socketRef.current = socket
    const versions = new Map<string, number>()
    let active = true
    socket.on('connect', () => {
      setState((previous) => ({ ...previous, connected: true }))
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
      void queryClient.invalidateQueries({ predicate: isCartQuery })
    })
    socket.on('disconnect', () => setState((previous) => ({ ...previous, connected: false })))
    socket.on('connect_error', () => setState((previous) => ({ ...previous, connected: false })))
    socket.on('nft.updated', async (event) => {
      if (!isNftUpdated(event)) return
      const detail = queryClient.getQueryData<Nft>(nftKeys.detail(event.resourceId))
      const lists = queryClient.getQueriesData<NftList>({ queryKey: nftKeys.lists })
      const cachedVersion = Math.max(detail?.version ?? 0, ...lists.map(([, list]) => list?.items.find((nft) => nft.id === event.resourceId)?.version ?? 0))
      if (event.version <= Math.max(versions.get(event.resourceId) ?? 0, cachedVersion)) return
      versions.set(event.resourceId, event.version)
      await queryClient.cancelQueries({ queryKey: nftKeys.all })
      if (!active || versions.get(event.resourceId) !== event.version) return
      queryClient.setQueryData<Nft>(nftKeys.detail(event.resourceId), (previous) => previous && previous.version < event.version ? event.resource : previous)
      setState((previous) => ({ ...previous, received: previous.received + 1, message: `${event.resource.name}: ${event.resource.priceEth} ETH · ${event.resource.available} disponíveis (v${event.version})` }))
      await queryClient.cancelQueries({ predicate: isCartQuery })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: nftKeys.all }),
        queryClient.invalidateQueries({ predicate: isCartQuery }),
      ])
    })
    socket.connect()
    return () => {
      active = false
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [queryClient])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !session) return
    let active = true
    const versions = new Map<string, number>()
    const key = ['private', session.user.id, session.id, 'orders']
    const subscribe = () => { if (auth.isCurrent(session)) { socket.emit('session.subscribe', { token: session.token, sessionId: session.id }); void queryClient.invalidateQueries({ queryKey: key }) } }
    const updated = async (event: unknown) => {
      if (!active || !auth.isCurrent(session) || !isOrderUpdated(event) || event.userId !== session.user.id || event.sessionId !== session.id) return
      const previous = queryClient.getQueryData<Order>([...key, event.resourceId])
      if ((previous && previous.status !== 'pending') || event.version <= Math.max(previous?.version ?? 0, versions.get(event.resourceId) ?? 0)) return
      versions.set(event.resourceId, event.version)
      await queryClient.cancelQueries({ queryKey: key })
      if (!active || !auth.isCurrent(session) || versions.get(event.resourceId) !== event.version) return
      setState((previousState) => ({ ...previousState, orderSessionId: session.id, orderReceived: previousState.orderSessionId === session.id ? previousState.orderReceived + 1 : 1, orderMessage: `Pedido atualizado: ${event.status} (v${event.version}).` }))
      await Promise.all([queryClient.invalidateQueries({ queryKey: key }), queryClient.invalidateQueries({ predicate: isCartQuery })])
    }
    socket.on('connect', subscribe)
    socket.on('order.updated', updated)
    if (socket.connected) subscribe()
    return () => { active = false; socket.off('connect', subscribe); socket.off('order.updated', updated); socket.emit('session.unsubscribe') }
  }, [session, queryClient])

  return <LiveContext.Provider value={{ ...state, orderReceived: state.orderSessionId === session?.id ? state.orderReceived : 0, orderMessage: state.orderSessionId === session?.id ? state.orderMessage : '' }}>{children}</LiveContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLiveUpdates() {
  return useContext(LiveContext)
}
