const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

function toApiUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function apiRequest(path, { method = 'GET', token, body, headers } = {}) {
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(headers || {}),
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(toApiUrl(path), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = await parseJsonSafe(response)
  if (!response.ok) {
    const message = payload?.message || payload?.detail || `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export const authApi = {
  loginUser(email, password) {
    return apiRequest('/api/auth/user', {
      method: 'POST',
      body: { email, password },
    })
  },
}

export const superAdminApi = {
  getGameTypeAvailability(token) {
    return apiRequest('/api/game/game-types/availability', { token })
  },
  updateGameTypeAvailability(token, enabledGameTypes) {
    return apiRequest('/api/game/game-types/availability', {
      method: 'PUT',
      token,
      body: { enabled_game_types: enabledGameTypes },
    })
  },
  listUsers(token) {
    return apiRequest('/api/super-admin/users', { token })
  },
  getUser(token, userId) {
    return apiRequest(`/api/super-admin/users/${userId}`, { token })
  },
  createUser(token, body) {
    return apiRequest('/api/super-admin/users', {
      method: 'POST',
      token,
      body,
    })
  },
  updateUser(token, userId, body) {
    return apiRequest(`/api/super-admin/users/${userId}`, {
      method: 'PUT',
      token,
      body,
    })
  },
  deleteUser(token, userId) {
    return apiRequest(`/api/super-admin/users/${userId}`, {
      method: 'DELETE',
      token,
    })
  },
}
