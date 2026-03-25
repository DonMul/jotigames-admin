const THEME_KEY = 'jotigames-admin-theme'

export function getTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Apply theme visually (classList + meta) without persisting to localStorage. */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = theme === 'dark' ? '#020617' : '#f8fafc'
}

export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch { /* ignore */ }
  applyTheme(theme)
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

export function initTheme() {
  // Apply without persisting so system-preference tracking stays active for
  // users who haven't explicitly toggled the theme.
  applyTheme(getTheme())
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', (e) => {
      const stored = localStorage.getItem(THEME_KEY)
      if (!stored) {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    })
  } catch { /* ignore */ }
}
