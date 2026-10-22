const key = 'kurio:guest-cart'
let memory: string | undefined
let controller = new AbortController()
export const guestCart = {
  id() {
    try { memory = localStorage.getItem(key) ?? memory } catch { /* Memory-only fallback. */ }
    if (!memory) {
      memory = `guest:${crypto.randomUUID()}`
      try { localStorage.setItem(key, memory) } catch { /* Memory-only fallback. */ }
    }
    return memory
  },
  signal: () => controller.signal,
  rotate() {
    controller.abort()
    controller = new AbortController()
    memory = `guest:${crypto.randomUUID()}`
    try { localStorage.setItem(key, memory) } catch { /* Memory-only fallback. */ }
  },
}
