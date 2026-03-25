const STORAGE_KEY = 'jotigames_super_admin_session'

export function readSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeSession(session) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function hasSuperAdminRole(session) {
  const roles = Array.isArray(session?.roles) ? session.roles : []
  return roles.includes('ROLE_SUPER_ADMIN')
}

export function hasAdminRole(session) {
  const roles = Array.isArray(session?.roles) ? session.roles : []
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN')
}
