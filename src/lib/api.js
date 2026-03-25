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
  getUserGames(token, userId) {
    return apiRequest(`/api/super-admin/users/${userId}/games`, { token })
  },
}

export const gameApi = {
  async listGames(token) {
    const payload = await apiRequest('/api/game', { token })
    return Array.isArray(payload?.games) ? payload.games : []
  },
  async getGame(token, gameId) {
    const payload = await apiRequest(`/api/game/${gameId}`, { token })
    return payload?.game || null
  },
  async listTeams(token, gameId) {
    const payload = await apiRequest(`/api/game/${gameId}/teams`, { token })
    return Array.isArray(payload?.teams) ? payload.teams : []
  },
  async listMembers(token, gameId) {
    const payload = await apiRequest(`/api/game/${gameId}/members`, { token })
    return Array.isArray(payload?.members) ? payload.members : []
  },
  createGame(token, body) {
    return apiRequest('/api/game', { method: 'POST', token, body })
  },
  updateGame(token, gameId, body) {
    return apiRequest(`/api/game/${gameId}`, { method: 'PUT', token, body })
  },
  deleteGame(token, gameId) {
    return apiRequest(`/api/game/${gameId}`, { method: 'DELETE', token })
  },
  resetGame(token, gameId) {
    return apiRequest(`/api/game/${gameId}/reset`, { method: 'POST', token })
  },
  createTeam(token, gameId, body) {
    return apiRequest(`/api/game/${gameId}/teams`, { method: 'POST', token, body })
  },
  deleteTeam(token, gameId, teamId) {
    return apiRequest(`/api/game/${gameId}/teams/${teamId}`, { method: 'DELETE', token })
  },
  sendTeamMessage(token, gameId, teamId, message, level = 'info') {
    return apiRequest(`/api/game/${gameId}/teams/${teamId}/message`, { method: 'POST', token, body: { message, level } })
  },
  async getOverview(token, gameType, gameId) {
    const MODULE_PREFIX = {
      geohunter: 'geohunter', blindhike: 'blindhike', resource_run: 'resource-run',
      territory_control: 'territory-control', market_crash: 'market-crash', crazy_88: 'crazy88',
      courier_rush: 'courier-rush', echo_hunt: 'echo-hunt', checkpoint_heist: 'checkpoint-heist',
      pandemic_response: 'pandemic-response', birds_of_prey: 'birds-of-prey',
      code_conspiracy: 'code-conspiracy', exploding_kittens: 'exploding-kittens',
    }
    const prefix = MODULE_PREFIX[gameType]
    if (!prefix) return null
    const payload = await apiRequest(`/api/${prefix}/${gameId}/overview`, { token })
    return payload?.overview || null
  },
  async getGameTypes(token) {
    const payload = await apiRequest('/api/game/game-types', { token })
    return Array.isArray(payload?.game_types) ? payload.game_types : []
  },
}
