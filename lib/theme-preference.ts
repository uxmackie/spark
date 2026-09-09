export const themeStorageKey = 'spark:theme'
export type ThemePreference = 'light' | 'dark'
export function parseTheme(value: unknown): ThemePreference { return value === 'light' ? 'light' : 'dark' }
export function applyTheme(theme: ThemePreference) {
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
export function saveTheme(theme: ThemePreference) {
  applyTheme(theme)
  try { localStorage.setItem(themeStorageKey, theme) } catch { /* DOM state still persists during navigation. */ }
  window.dispatchEvent(new Event('spark-theme-change'))
}
// Runs before page content paints; only fixed strings enter this script.
export const themeBootstrap = `try{var t=localStorage.getItem('${themeStorageKey}')==='light'?'light':'dark';document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`
