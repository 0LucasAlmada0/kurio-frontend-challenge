import type { ProfileUpdate } from '@/api/contracts'

export const avatarLimit = 512 * 1024
export const avatarTypes = ['image/png', 'image/jpeg', 'image/webp']
export function avatarError(type: string, size: number) {
  if (!avatarTypes.includes(type)) return 'Use uma imagem PNG, JPEG ou WebP.'
  if (size > avatarLimit || size === 0) return 'A imagem deve ter até 512 KB e não pode estar vazia.'
  return ''
}
export function validateProfile(input: Partial<ProfileUpdate> | undefined) {
  const fields: Record<string, string> = {}
  for (const field of ['displayName', 'username'] as const) if (typeof input?.[field] !== 'string' || input[field].trim().length < 2 || input[field].length > 60) fields[field] = 'Informe de 2 a 60 caracteres.'
  if (typeof input?.username === 'string' && !/^[\p{L}\d_.-]+$/u.test(input.username.trim())) fields.username = 'Use letras, números, ponto, hífen ou sublinhado.'
  if (typeof input?.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) fields.email = 'Informe um e-mail válido.'
  if (typeof input?.ens !== 'string' || input.ens.length > 120 || (input.ens && !/^[a-z\d-]+(?:\.[a-z\d-]+)*\.eth$/i.test(input.ens.trim()))) fields.ens = 'Informe um nome terminado em .eth ou deixe vazio.'
  if (typeof input?.walletAlias !== 'string' || input.walletAlias.length > 60) fields.walletAlias = 'Use até 60 caracteres.'
  if (input?.avatar !== null) {
    try {
      if (typeof input?.avatar === 'string' && input.avatar.length > Math.ceil(avatarLimit * 4 / 3) + 100) { fields.avatar = 'A imagem deve ter até 512 KB.'; throw new Error() }
      const match = typeof input?.avatar === 'string' && input.avatar.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-z\d+/=]+)$/i)
      if (!match) throw new Error()
      const bytes = atob(match[2]!)
      const type = match[1]!
      const error = avatarError(type, bytes.length)
      if (error) { fields.avatar = error }
      else if (!(type === 'image/png' ? bytes.startsWith('\x89PNG\r\n\x1a\n') : type === 'image/jpeg' ? bytes.startsWith('\xff\xd8\xff') : bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP')) throw new Error()
    } catch { fields.avatar ??= 'Imagem inválida. Use PNG, JPEG ou WebP.' }
  }
  if (input?.password) {
    const password = input.password
    if (typeof password.currentPassword !== 'string' || !password.currentPassword || password.currentPassword.length > 128) fields.currentPassword = 'Informe sua senha atual.'
    if (typeof password.newPassword !== 'string' || password.newPassword.length < 8 || password.newPassword.length > 128) fields.newPassword = 'Use entre 8 e 128 caracteres.'
    else if (password.currentPassword === password.newPassword) fields.newPassword = 'Escolha uma senha diferente da atual.'
    if (password.confirmPassword !== password.newPassword) fields.confirmPassword = 'As senhas não coincidem.'
  }
  return fields
}
