import { describe, expect, it, beforeEach, vi } from 'vitest'

import { getTheme, setTheme, toggleTheme, initTheme } from './theme'

describe('admin theme utility', () => {
  const storage = new Map()
  let classList

  beforeEach(() => {
    storage.clear()
    classList = new Set()

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => (storage.has(key) ? storage.get(key) : null),
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: (key) => storage.delete(key),
        clear: () => storage.clear(),
      },
    })

    Object.defineProperty(document.documentElement, 'classList', {
      configurable: true,
      value: {
        add: (c) => classList.add(c),
        remove: (c) => classList.delete(c),
        contains: (c) => classList.has(c),
      },
    })

    // Remove any existing meta[name="theme-color"] created in previous tests
    document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove())
  })

  // ---------- getTheme ----------

  describe('getTheme', () => {
    it('returns "dark" when localStorage stores dark', () => {
      storage.set('jotigames-admin-theme', 'dark')
      expect(getTheme()).toBe('dark')
    })

    it('returns "light" when localStorage stores light', () => {
      storage.set('jotigames-admin-theme', 'light')
      expect(getTheme()).toBe('light')
    })

    it('falls back to system dark preference when nothing stored', () => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: true }),
      })
      expect(getTheme()).toBe('dark')
    })

    it('falls back to system light preference when nothing stored', () => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: false }),
      })
      expect(getTheme()).toBe('light')
    })

    it('ignores invalid stored value and uses system preference', () => {
      storage.set('jotigames-admin-theme', 'invalid')
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: true }),
      })
      expect(getTheme()).toBe('dark')
    })
  })

  // ---------- setTheme ----------

  describe('setTheme', () => {
    it('adds "dark" class to documentElement when setting dark', () => {
      setTheme('dark')
      expect(classList.has('dark')).toBe(true)
    })

    it('removes "dark" class from documentElement when setting light', () => {
      classList.add('dark')
      setTheme('light')
      expect(classList.has('dark')).toBe(false)
    })

    it('stores theme in localStorage', () => {
      setTheme('dark')
      expect(storage.get('jotigames-admin-theme')).toBe('dark')
      setTheme('light')
      expect(storage.get('jotigames-admin-theme')).toBe('light')
    })

    it('updates meta theme-color when meta tag exists', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      meta.content = '#f8fafc'
      document.head.appendChild(meta)

      setTheme('dark')
      expect(meta.content).toBe('#020617')

      setTheme('light')
      expect(meta.content).toBe('#f8fafc')
    })
  })

  // ---------- toggleTheme ----------

  describe('toggleTheme', () => {
    it('toggles from light to dark', () => {
      storage.set('jotigames-admin-theme', 'light')
      const result = toggleTheme()
      expect(result).toBe('dark')
      expect(classList.has('dark')).toBe(true)
      expect(storage.get('jotigames-admin-theme')).toBe('dark')
    })

    it('toggles from dark to light', () => {
      storage.set('jotigames-admin-theme', 'dark')
      classList.add('dark')
      const result = toggleTheme()
      expect(result).toBe('light')
      expect(classList.has('dark')).toBe(false)
      expect(storage.get('jotigames-admin-theme')).toBe('light')
    })
  })

  // ---------- initTheme ----------

  describe('initTheme', () => {
    it('applies stored dark theme on init without re-persisting', () => {
      storage.set('jotigames-admin-theme', 'dark')
      initTheme()
      expect(classList.has('dark')).toBe(true)
      // initTheme should not overwrite localStorage (preserves system-preference tracking)
    })

    it('applies stored light theme on init without re-persisting', () => {
      classList.add('dark')
      storage.set('jotigames-admin-theme', 'light')
      initTheme()
      expect(classList.has('dark')).toBe(false)
    })

    it('does not persist to localStorage when theme comes from system preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() }),
      })
      // No stored preference
      initTheme()
      expect(classList.has('dark')).toBe(true)
      // Should NOT have stored anything — system pref should stay reactive
      expect(storage.has('jotigames-admin-theme')).toBe(false)
    })

    it('registers media-query listener for system preference changes', () => {
      const addEventListener = vi.fn()
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: false, addEventListener }),
      })
      initTheme()
      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('system preference change updates theme when no stored preference', () => {
      let changeHandler
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({
          matches: false,
          addEventListener: (_event, handler) => { changeHandler = handler },
        }),
      })

      // No stored preference
      initTheme()
      expect(classList.has('dark')).toBe(false)

      // Simulate system switching to dark
      changeHandler({ matches: true })
      expect(classList.has('dark')).toBe(true)

      // Simulate system switching back to light
      changeHandler({ matches: false })
      expect(classList.has('dark')).toBe(false)
    })

    it('system preference change is ignored when user has explicit preference', () => {
      let changeHandler
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({
          matches: false,
          addEventListener: (_event, handler) => { changeHandler = handler },
        }),
      })

      storage.set('jotigames-admin-theme', 'light')
      initTheme()

      // Simulate system switching to dark — should be ignored
      changeHandler({ matches: true })
      expect(classList.has('dark')).toBe(false)
    })
  })
})
