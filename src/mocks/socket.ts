import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { NftUpdated } from '@/api/contracts'

const origin = (import.meta.env.VITE_SOCKET_URL || window.location.origin).replace(/^http/, 'ws')
const channel = ws.link(origin)
const clients = new Set<ReturnType<typeof toSocketIo>>()

export const socketHandler = channel.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  clients.add(io)
  // The published binding handles the handshake; Engine.IO heartbeats remain ours.
  const heartbeat = window.setInterval(() => connection.client.send('2'), 10_000)
  connection.client.addEventListener('close', () => {
    window.clearInterval(heartbeat)
    clients.delete(io)
  })
})

export function emitNftUpdated(event: NftUpdated) {
  for (const io of clients) io.client.emit('nft.updated', event)
}

export function disconnectClients() {
  for (const io of clients) io.rawClient.close(1012, 'Mock reconnect scenario')
}
