import { describe, expect, it, beforeEach } from 'vitest'

import { clearSession, hasSuperAdminRole, readSession, writeSession } from './auth'

describe('admin auth session storage', () => {
  const storage = new Map()

  beforeEach(() => {
    storage.clear()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => (storage.has(key) ? storage.get(key) : null),
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: (key) => storage.delete(key),
        clear: () => storage.clear(),
      },
    })
  })

  it('writes and reads session from localStorage', () => {
    const session = { token: 'abc', roles: ['ROLE_USER'] }
    writeSession(session)

    expect(readSession()).toEqual(session)
  })

  it('returns null when session is malformed', () => {
    window.localStorage.setItem('jotigames_super_admin_session', '{broken')
    expect(readSession()).toBeNull()
  })

  it('clears session', () => {
    writeSession({ token: 'abc' })
    clearSession()
    expect(readSession()).toBeNull()
  })

  it('detects super-admin role', () => {
    expect(hasSuperAdminRole({ roles: ['ROLE_USER', 'ROLE_SUPER_ADMIN'] })).toBe(true)
    expect(hasSuperAdminRole({ roles: ['ROLE_USER'] })).toBe(false)
    expect(hasSuperAdminRole(null)).toBe(false)
  })
})
