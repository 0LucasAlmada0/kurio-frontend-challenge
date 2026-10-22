import type { Collector, WalletInput } from '@/api/contracts'

export function validateCollector(input: Partial<Collector> | undefined) {
  const fields: Record<string, string> = {}
  for (const field of ['displayName', 'username', 'profileName'] as const) {
    if (typeof input?.[field] !== 'string' || input[field].trim().length < 2 || input[field].length > 60) fields[field] = 'Informe de 2 a 60 caracteres.'
  }
  if (typeof input?.username === 'string' && !/^[\p{L}\d_.-]+$/u.test(input.username.trim())) fields.username = 'Use letras, números, ponto, hífen ou sublinhado.'
  if (typeof input?.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || input.email.length > 254) fields.email = 'Informe um e-mail válido.'
  for (const field of ['ens', 'referralCode', 'note'] as const) if (typeof input?.[field] !== 'string') fields[field] = 'Campo inválido.'
  if (input?.ens && !/^[a-z\d-]+(?:\.[a-z\d-]+)*\.eth$/i.test(input.ens.trim())) fields.ens = 'Informe um nome terminado em .eth.'
  if (input?.referralCode && !/^[a-z\d_-]{1,32}$/i.test(input.referralCode.trim())) fields.referralCode = 'Código de indicação inválido.'
  if ((input?.note?.length ?? 0) > 500) fields.note = 'Use até 500 caracteres.'
  return fields
}
export function normalizeCollector(input: Collector): Collector {
  return { displayName: input.displayName.trim(), username: input.username.trim(), profileName: input.profileName.trim(), email: input.email.trim().toLowerCase(), ens: input.ens.trim().toLowerCase(), referralCode: input.referralCode.trim(), note: input.note.trim() }
}
export function validateWallet(input: Partial<WalletInput> | undefined) {
  const fields: Record<string, string> = {}
  if (typeof input?.label !== 'string' || input.label.trim().length < 2 || input.label.length > 60) fields.label = 'Informe de 2 a 60 caracteres.'
  if (typeof input?.address !== 'string' || !/^(0x[\da-f]{40}|[a-z\d-]+(?:\.[a-z\d-]+)*\.eth)$/i.test(input.address.trim()) || input.address.length > 120) fields.address = 'Informe endereço 0x com 40 caracteres hexadecimais ou ENS .eth.'
  if (!['ethereum', 'polygon'].includes(input?.networkId ?? '')) fields.networkId = 'Selecione uma rede válida.'
  if (!['primary', 'secondary'].includes(input?.kind ?? '')) fields.kind = 'Selecione principal ou secundária.'
  return fields
}
