import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'

export type HealthState = 'checking' | 'online' | 'offline'

export function useBackendHealth(): HealthState {
  const [state, setState] = useState<HealthState>('checking')
  useEffect(() => {
    let active = true
    const check = () => getHealth().then(
      response => { if (active) setState(response.status === 'ok' ? 'online' : 'offline') },
      () => { if (active) setState('offline') },
    )
    check()
    const timer = window.setInterval(check, 30_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])
  return state
}
