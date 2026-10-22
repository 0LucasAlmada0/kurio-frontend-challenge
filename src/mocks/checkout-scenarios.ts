export interface CheckoutScenario {
  payment: 'confirmed' | 'refused' | 'pending'
  settlementDelay: number
  timeoutAfterCreate: boolean
  connectionRefused: boolean
  disconnectPending: boolean
  beforeCreate: 'none' | 'price' | 'sold-out' | 'expired' | 'session-expired'
}
const key = 'kurio:checkout-scenario'
const defaults: CheckoutScenario = { payment: 'confirmed', settlementDelay: 1200, timeoutAfterCreate: false, connectionRefused: false, disconnectPending: false, beforeCreate: 'none' }
let memory = { ...defaults }
export function checkoutScenario(): CheckoutScenario {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') as CheckoutScenario || memory } catch { return memory }
}
export const checkoutPresets = ['success', 'refused', 'pending', 'timeout', 'connection-refused', 'stale', 'price', 'sold-out', 'disconnect', 'session-expired'] as const
export function setCheckoutScenario(input: Partial<CheckoutScenario> & { preset?: typeof checkoutPresets[number] }) {
  const value = input.preset ? { ...defaults } : checkoutScenario()
  if (input.preset === 'refused' || input.preset === 'pending') value.payment = input.preset
  if (input.preset === 'timeout') value.timeoutAfterCreate = true
  if (input.preset === 'connection-refused') value.connectionRefused = true
  if (input.preset === 'disconnect') { value.disconnectPending = true; value.settlementDelay = 3000 }
  if (input.preset === 'stale') value.beforeCreate = 'expired'
  if (['price', 'sold-out', 'session-expired'].includes(input.preset ?? '')) value.beforeCreate = input.preset as CheckoutScenario['beforeCreate']
  if (['confirmed', 'refused', 'pending'].includes(input.payment ?? '')) value.payment = input.payment!
  if (Number.isSafeInteger(input.settlementDelay) && input.settlementDelay! >= 0 && input.settlementDelay! <= 60_000) value.settlementDelay = input.settlementDelay!
  for (const field of ['timeoutAfterCreate', 'connectionRefused', 'disconnectPending'] as const) if (typeof input[field] === 'boolean') value[field] = input[field]
  if (['none', 'price', 'sold-out', 'expired', 'session-expired'].includes(input.beforeCreate ?? '')) value.beforeCreate = input.beforeCreate!
  memory = value
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* Memory-only scenario. */ }
  return value
}
export function resetCheckoutScenario() { memory = { ...defaults }; try { sessionStorage.removeItem(key) } catch { /* Memory-only scenario. */ } }
