import { useEffect } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { auth } from './session'
import { useAuth } from './use-auth'

export function AuthLifecycle() {
  const state = useAuth()
  const router = useRouter()
  const href = useRouterState({ select: (value) => value.location.href })
  useEffect(() => {
    void auth.ready()
    const refresh = () => { if (auth.getSnapshot().session) void auth.restore() }
    const storage = (event: StorageEvent) => { if (event.key === 'kurio:session-token' || event.key === null) auth.syncStorage() }
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', storage)
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('storage', storage) }
  }, [])
  useEffect(() => {
    if (state.status !== 'loading') void router.invalidate()
    if (state.reason === 'expired' && !/^\/(login|cadastro)([?#]|$)/.test(href)) void router.navigate({ to: '/login', search: { redirect: href, reason: 'expired' }, replace: true })
  }, [state.status, state.session?.id, state.reason, router, href])
  return null
}
