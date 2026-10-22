import type { Collector, OrderInput } from '@/api/contracts'
export interface Attempt { key: string; input: OrderInput; orderId?: string }
const memory = new Map<string, Attempt | null>()
export function readAttempt(userId: string): Attempt | null {
  try { return JSON.parse(localStorage.getItem(`kurio:attempt:${userId}`) || 'null') as Attempt | null } catch { return memory.get(userId) ?? null }
}
export function saveAttempt(userId: string, attempt: Attempt | null) {
  memory.set(userId, attempt)
  try { if (attempt) localStorage.setItem(`kurio:attempt:${userId}`, JSON.stringify(attempt)); else localStorage.removeItem(`kurio:attempt:${userId}`) } catch { /* In-memory recovery if persistence is unavailable. */ }
}
export function readCollector(userId: string): Collector | null {
  try { return JSON.parse(localStorage.getItem(`kurio:collector:${userId}`) || 'null') as Collector | null } catch { return null }
}
export function saveCollector(userId: string, collector: Collector) {
  try { localStorage.setItem(`kurio:collector:${userId}`, JSON.stringify(collector)) } catch { /* The current form remains usable. */ }
}
