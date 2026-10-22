import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { NftUpdated, Order, OrderUpdated } from '@/api/contracts'
import { authStore } from './auth-store'

const origin = (import.meta.env.VITE_SOCKET_URL || window.location.origin).replace(/^http/, 'ws')
const channel = ws.link(origin)
const clients = new Set<ReturnType<typeof toSocketIo>>()
const subscriptions = new Map<ReturnType<typeof toSocketIo>, { token: string; sessionId: string; userId: string }>()
function authorizeToken(token: string) { return authStore.authorize(new Request(window.location.origin, { headers: { Authorization: `Bearer ${token}` } })) }

export const socketHandler = channel.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  clients.add(io)
  io.client.on('session.subscribe', (_, input: { token?: string; sessionId?: string }) => {
    subscriptions.delete(io)
    const session = typeof input?.token === 'string' ? authorizeToken(input.token) : undefined
    if (!session || session.id !== input.sessionId) return
    subscriptions.set(io, { token: session.token, sessionId: session.id, userId: session.user.id })
    io.client.emit('session.ready', { userId: session.user.id, sessionId: session.id })
  })
  io.client.on('session.unsubscribe', () => subscriptions.delete(io))
  // The published binding handles the handshake; Engine.IO heartbeats remain ours.
  const heartbeat = window.setInterval(() => connection.client.send('2'), 10_000)
  connection.client.addEventListener('close', () => {
    window.clearInterval(heartbeat)
    clients.delete(io)
    subscriptions.delete(io)
  })
})

export function emitNftUpdated(event: NftUpdated) {
  for (const io of clients) io.client.emit('nft.updated', event)
}

export function disconnectClients() {
  for (const io of clients) io.rawClient.close(1012, 'Mock reconnect scenario')
}

export function emitOrderUpdated(order: Order) {
  for (const [io, subscription] of subscriptions) {
    const session = authorizeToken(subscription.token)
    if (!session || session.id !== subscription.sessionId) { subscriptions.delete(io); continue }
    if (order.userId !== session.user.id) continue
    const event: OrderUpdated = { eventId: `${order.id}:v${order.version}`, scope: 'private', sessionId: session.id, userId: session.user.id, resourceId: order.id, version: order.version, status: order.status }
    io.client.emit('order.updated', event)
  }
}
export function replayOrderUpdated(event: OrderUpdated) {
  for (const [io, subscription] of subscriptions) {
    const session = authorizeToken(subscription.token)
    if (session?.id === event.sessionId && session.user.id === event.userId) io.client.emit('order.updated', event)
  }
}
