'use client'
import { useSyncExternalStore } from 'react'
import { applyTheme, parseTheme, saveTheme, themeStorageKey } from '@/lib/theme-preference'
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === themeStorageKey || event.key === null) { applyTheme(parseTheme(event.newValue)); callback() }
  }
  window.addEventListener('spark-theme-change', callback)
  window.addEventListener('storage', storage)
  return () => { window.removeEventListener('spark-theme-change', callback); window.removeEventListener('storage', storage) }
}
const snapshot = () => document.documentElement.dataset.theme === 'light'
export function useTheme() {
  const light = useSyncExternalStore(subscribe, snapshot, () => false)
  return { light, toggleTheme: () => saveTheme(snapshot() ? 'dark' : 'light') }
}
