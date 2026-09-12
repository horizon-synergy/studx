import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export const PRO_THEMES = [
  { id: 'midnight_campus', label: 'Midnight Campus' },
  { id: 'sunset_quad', label: 'Sunset Quad' },
  { id: 'forest_study', label: 'Forest Study' },
  { id: 'rose_gold', label: 'Rose Gold' },
  { id: 'cyber_neon', label: 'Cyber Neon' },
  { id: 'ocean_breeze', label: 'Ocean Breeze' },
  { id: 'mono_slate', label: 'Mono Slate' },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { const saved = localStorage.getItem('studx_theme'); if (saved) return saved } catch (_) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [proTheme, setProThemeState] = useState(() => {
    try { return localStorage.getItem('studx_pro_theme') || '' } catch (_) { return '' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('studx_theme', theme) } catch (_) {}
  }, [theme])

  useEffect(() => {
    if (proTheme) document.documentElement.setAttribute('data-pro-theme', proTheme)
    else document.documentElement.removeAttribute('data-pro-theme')
    try {
      if (proTheme) localStorage.setItem('studx_pro_theme', proTheme)
      else localStorage.removeItem('studx_pro_theme')
    } catch (_) {}
  }, [proTheme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const setProTheme = (id) => setProThemeState(id || '')

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggle, proTheme, setProTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}