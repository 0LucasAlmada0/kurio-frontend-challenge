export const scenarioNames = ['success', 'empty', 'error', 'slow', 'variable', 'offline', 'timeout'] as const
export type Scenario = typeof scenarioNames[number]
let scenario: Scenario = 'success'

export function setScenario(value: unknown) {
  if (!scenarioNames.includes(value as Scenario)) return false
  scenario = value as Scenario
  return true
}

export function getScenario() { return scenario }
export function latency(search: string) {
  if (scenario === 'slow') return 1_800
  if (scenario === 'timeout') return 9_000
  if (scenario === 'variable') return search.length % 2 ? 1_200 : 100
  return 120
}
