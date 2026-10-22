const key = 'kurio:auth-scenario'
const defaults = { authFailure: false, favoritesFailure: false, privateDelay: 120, mutationDelay: 350 }
let scenario = { ...defaults }
try { Object.assign(scenario, JSON.parse(sessionStorage.getItem(key) || '{}')) } catch { /* Default network scenario. */ }

export function getAuthScenario() { return scenario }
export function setAuthScenario(input: Partial<typeof defaults>) {
  if (typeof input.authFailure === 'boolean') scenario.authFailure = input.authFailure
  if (typeof input.favoritesFailure === 'boolean') scenario.favoritesFailure = input.favoritesFailure
  for (const field of ['privateDelay', 'mutationDelay'] as const) {
    const value = input[field]
    if (typeof value === 'number' && value >= 0 && value <= 6_000) scenario[field] = value
  }
  try { sessionStorage.setItem(key, JSON.stringify(scenario)) } catch { /* In-memory scenario. */ }
}
export function resetAuthScenario() {
  scenario = { ...defaults }
  try { sessionStorage.removeItem(key) } catch { /* In-memory scenario. */ }
}
