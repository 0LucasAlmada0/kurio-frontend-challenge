import { io, type Socket } from 'socket.io-client'
import type { ClientEvents, ServerEvents } from '@/api/contracts'

export function createSocket(): Socket<ServerEvents, ClientEvents> {
  return io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5_000,
  })
}
