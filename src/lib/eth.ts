import type { Eth } from '@/api/contracts'

export function ethToWei(value: Eth): bigint {
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'))
}
