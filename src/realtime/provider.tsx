import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Nft, NftList } from '@/api/contracts'
import { nftKeys } from '@/features/catalog/queries'
import { createSocket } from './client'
import { isNftUpdated } from './events'
import { isCartQuery } from '@/features/cart/queries'

const LiveContext = createContext({ connected: false, message: '', received: 0 })

export function LiveUpdatesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState({ connected: false, message: '', received: 0 })

  useEffect(() => {
    const socket = createSocket()
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
    }
  }, [queryClient])

  return <LiveContext.Provider value={state}>{children}</LiveContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLiveUpdates() {
  return useContext(LiveContext)
}
