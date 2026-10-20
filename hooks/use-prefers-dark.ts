import { useSyncExternalStore } from 'react'

const query = '(prefers-color-scheme: dark)'
const subscribe = (callback: () => void) => {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

export function usePrefersDark() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
