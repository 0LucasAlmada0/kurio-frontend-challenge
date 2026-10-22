import { useSyncExternalStore } from 'react'
import { auth } from './session'

export function useAuth() { return useSyncExternalStore(auth.subscribe, auth.getSnapshot) }
