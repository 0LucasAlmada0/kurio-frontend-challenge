import { io, type Socket } from 'socket.io-client'
import type { ServerEvents } from '@/api/contracts'

export function createSocket(): Socket<ServerEvents> {
  return io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5_000,
  })
}
