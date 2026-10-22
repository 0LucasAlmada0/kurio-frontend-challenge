import type { LoginInput, RegisterInput } from '@/api/contracts'

export function validateCredentials(input: LoginInput | RegisterInput): Record<string, string> {
  const fields: Record<string, string> = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || input.email.length > 254) fields.email = 'Informe um e-mail válido.'
  if (!input.password || input.password.length > 128) fields.password = 'Informe sua senha (até 128 caracteres).'
  if ('name' in input) {
    if (input.name.trim().length < 2 || input.name.trim().length > 60) fields.name = 'Use entre 2 e 60 caracteres.'
    if (input.password.length < 8) fields.password = 'A senha deve ter pelo menos 8 caracteres.'
    if (input.confirmPassword !== input.password) fields.confirmPassword = 'As senhas não coincidem.'
  }
  return fields
}

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some((character) => character.charCodeAt(0) <= 32)) return '/'
  try {
    const url = new URL(value, 'https://kurio.invalid')
    const path = url.pathname.replace(/\/+$/, '')
    if (url.origin !== 'https://kurio.invalid' || path === '/login' || path === '/cadastro') return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch { return '/' }
}
