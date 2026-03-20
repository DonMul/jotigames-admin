import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import { authApi, superAdminApi } from './lib/api'
import { clearSession, hasSuperAdminRole, readSession, writeSession } from './lib/auth'

function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="center-screen">
      <div className="card loading-card">{label}</div>
    </div>
  )
}

function formatDate(value) {
  const raw = String(value || '').trim()
  if (!raw) {
    return '-'
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw
  }
  return parsed.toLocaleString()
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function toCsvValue(value) {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await authApi.loginUser(email.trim(), password)
      if (!result || !Array.isArray(result.roles) || !result.roles.includes('ROLE_SUPER_ADMIN')) {
        throw new Error('Only Super Admin accounts can sign in here.')
      }

      const session = {
        token: String(result.access_token || ''),
        token_type: String(result.token_type || 'Bearer'),
        principal_type: String(result.principal_type || ''),
        principal_id: String(result.principal_id || ''),
        access_level: String(result.access_level || ''),
        roles: result.roles,
        expires_at: String(result.expires_at || ''),
      }

      writeSession(session)
      onLogin(session)
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="center-screen">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">JotiGames</p>
        <h1>Admin</h1>

        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

function DashboardLayout({ session, onLogout }) {
  const location = useLocation()
  const isUserCreate = location.pathname.endsWith('/users/new')
  const isUserEdit = /\/dashboard\/users\/.+\/edit$/.test(location.pathname)

  return (
    <div className="shell">
      <aside className="sidebar">

        <div className="brand">
          <p className="eyebrow">JotiGames</p>
          <h2>Admin</h2>
        </div>

        <div className="sidebar-top-actions">
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>

        <nav className="nav-links">
          <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'active' : '')}>Overview</NavLink>
          <NavLink to="/dashboard/game-modes" className={({ isActive }) => (isActive ? 'active' : '')}>Game Modes</NavLink>
          <NavLink to="/dashboard/users" className={({ isActive }) => (isActive ? 'active' : '')}>Users</NavLink>
        </nav>

        <div className="sidebar-footer">
          <p className="muted small">Signed in as {session?.principal_id || 'super-admin'}</p>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>
            {isUserCreate
              ? 'Create User'
              : isUserEdit
                ? 'Edit User'
                : location.pathname.endsWith('/users')
                  ? 'Users'
                  : location.pathname.endsWith('/game-modes')
                    ? 'Game Modes'
                    : 'Overview'}
          </h1>
          <p className="muted">Central controls for platform-wide administration</p>
        </header>

        <section className="page-body">
          <Routes>
            <Route index element={<OverviewPage session={session} />} />
            <Route path="game-modes" element={<GameModesPage session={session} />} />
            <Route path="users" element={<UsersPage session={session} />} />
            <Route path="users/new" element={<UserCreatePage session={session} />} />
            <Route path="users/:userId/edit" element={<UserEditPage session={session} />} />
          </Routes>
        </section>
      </main>
    </div>
  )
}

function UserForm({
  mode,
  submitting,
  error,
  onSubmit,
  onDelete,
  allowDelete,
  initialValues,
}) {
  const [email, setEmail] = useState(initialValues.email || '')
  const [username, setUsername] = useState(initialValues.username || '')
  const [password, setPassword] = useState('')
  const [roleUser, setRoleUser] = useState(true)
  const [roleSuperAdmin, setRoleSuperAdmin] = useState(Boolean(initialValues.roles?.includes('ROLE_SUPER_ADMIN')))
  const [isVerified, setIsVerified] = useState(Boolean(initialValues.is_verified))

  useEffect(() => {
    setEmail(initialValues.email || '')
    setUsername(initialValues.username || '')
    setRoleUser(true)
    setRoleSuperAdmin(Boolean(initialValues.roles?.includes('ROLE_SUPER_ADMIN')))
    setIsVerified(Boolean(initialValues.is_verified))
    setPassword('')
  }, [initialValues])

  function handleSubmit(event) {
    event.preventDefault()
    const roles = ['ROLE_USER', ...(roleSuperAdmin ? ['ROLE_SUPER_ADMIN'] : [])]
    onSubmit({
      email: email.trim(),
      username: username.trim(),
      ...(password.trim() ? { password } : {}),
      roles,
      is_verified: isVerified,
    })
  }

  return (
    <form className="card panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <h3>{mode === 'create' ? 'Create user' : 'Edit user'}</h3>
        <Link className="quick-link" to="/dashboard/users">Back to users</Link>
      </div>

      <div className="form-grid">
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Username
          <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} required />
        </label>
        <label>
          {mode === 'create' ? 'Password' : 'Password (leave blank to keep current)'}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required={mode === 'create'}
          />
        </label>
      </div>

      <div className="checkbox-row">
        <label className="switch">
          <input type="checkbox" checked={roleUser} disabled onChange={() => setRoleUser(true)} />
          <span>ROLE_USER (required)</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={roleSuperAdmin} onChange={(event) => setRoleSuperAdmin(event.target.checked)} />
          <span>ROLE_SUPER_ADMIN</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={isVerified} onChange={(event) => setIsVerified(event.target.checked)} />
          <span>Verified</span>
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="actions-inline">
        <button className="btn-success" type="submit" disabled={submitting}>{submitting ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}</button>
        {allowDelete ? <button className="btn-danger" type="button" disabled={submitting} onClick={onDelete}>Delete user</button> : null}
      </div>
    </form>
  )
}

function UserCreatePage({ session }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(payload) {
    setSubmitting(true)
    setError('')
    try {
      await superAdminApi.createUser(session.token, payload)
      navigate('/dashboard/users')
    } catch (err) {
      setError(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <UserForm
      mode="create"
      submitting={submitting}
      error={error}
      onSubmit={handleCreate}
      onDelete={() => {}}
      allowDelete={false}
      initialValues={{ email: '', username: '', roles: ['ROLE_USER'], is_verified: false }}
    />
  )
}

function UserEditPage({ session }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  async function loadUser() {
    setLoading(true)
    setError('')
    try {
      const payload = await superAdminApi.getUser(session.token, userId)
      setUser(payload?.user || null)
    } catch (err) {
      setError(err.message || 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [userId])

  async function handleUpdate(payload) {
    setSubmitting(true)
    setError('')
    try {
      await superAdminApi.updateUser(session.token, userId, payload)
      navigate('/dashboard/users')
    } catch (err) {
      setError(err.message || 'Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this user? This cannot be undone.')
    if (!confirmed) {
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await superAdminApi.deleteUser(session.token, userId)
      navigate('/dashboard/users')
    } catch (err) {
      setError(err.message || 'Failed to delete user')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="card panel">Loading user…</div>
  }

  if (!user) {
    return <div className="card panel">User not found.</div>
  }

  return (
    <UserForm
      mode="edit"
      submitting={submitting}
      error={error}
      onSubmit={handleUpdate}
      onDelete={handleDelete}
      allowDelete
      initialValues={user}
    />
  )
}

function OverviewPage({ session }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modeRows, setModeRows] = useState([])
  const [users, setUsers] = useState([])

  async function loadSummary() {
    setLoading(true)
    setError('')
    try {
      const [modesPayload, usersPayload] = await Promise.all([
        superAdminApi.getGameTypeAvailability(session.token),
        superAdminApi.listUsers(session.token),
      ])
      setModeRows(Array.isArray(modesPayload?.game_types) ? modesPayload.game_types : [])
      setUsers(Array.isArray(usersPayload?.users) ? usersPayload.users : [])
    } catch (err) {
      setError(err.message || 'Failed to load summary data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const enabledModeCount = modeRows.filter((row) => Boolean(row?.enabled)).length
  const disabledModeCount = Math.max(0, modeRows.length - enabledModeCount)
  const superAdminCount = users.filter((user) => Array.isArray(user?.roles) && user.roles.includes('ROLE_SUPER_ADMIN')).length
  const verifiedCount = users.filter((user) => Boolean(user?.is_verified)).length
  const verifiedPercent = users.length > 0 ? Math.round((verifiedCount / users.length) * 100) : 0

  if (loading) {
    return <div className="card panel">Loading overview…</div>
  }

  return (
    <div className="overview-layout">
      {error ? <p className="error-text">{error}</p> : null}

      <div className="grid cards-2">
        <article className="card panel">
          <h3>Game Modes</h3>
          <p className="metric">{enabledModeCount}</p>
          <p className="muted">Enabled globally</p>
          <p className="muted small">{disabledModeCount} disabled</p>
        </article>
        <article className="card panel">
          <h3>Users</h3>
          <p className="metric">{users.length}</p>
          <p className="muted">Total accounts</p>
          <p className="muted small">{verifiedPercent}% verified</p>
        </article>
      </div>

      <div className="grid cards-2">
        <article className="card panel">
          <h3>Super Admin Accounts</h3>
          <p className="metric">{superAdminCount}</p>
          <p className="muted">Users with platform-wide access</p>
        </article>
        <article className="card panel">
          <h3>Verified Users</h3>
          <p className="metric">{verifiedCount}</p>
          <p className="muted">Ready for authenticated usage</p>
        </article>
      </div>

      <div className="card panel">
        <div className="panel-header">
          <h3>Quick Actions</h3>
          <button className="ghost" onClick={loadSummary}>Refresh</button>
        </div>
        <div className="quick-actions">
          <NavLink className="quick-link" to="/dashboard/game-modes">Open Game Modes</NavLink>
          <NavLink className="quick-link" to="/dashboard/users">Open Users</NavLink>
        </div>
      </div>
    </div>
  )
}

function GameModesPage({ session }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [draftRows, setDraftRows] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('game_type')
  const [sortDir, setSortDir] = useState('asc')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const payload = await superAdminApi.getGameTypeAvailability(session.token)
      const gameTypes = Array.isArray(payload?.game_types) ? payload.game_types : []
      setRows(gameTypes)
      setDraftRows(gameTypes)
    } catch (err) {
      setError(err.message || 'Failed to load game modes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredRows = useMemo(() => {
    const q = normalizeText(query)
    const base = draftRows.filter((row) => {
      const type = normalizeText(row?.game_type)
      const enabled = Boolean(row?.enabled)
      const queryMatches = !q || type.includes(q)
      const filterMatches = statusFilter === 'all' || (statusFilter === 'enabled' ? enabled : !enabled)
      return queryMatches && filterMatches
    })

    const sorted = [...base].sort((left, right) => {
      const leftType = String(left?.game_type || '')
      const rightType = String(right?.game_type || '')
      if (sortBy === 'status') {
        const statusDiff = Number(Boolean(left?.enabled)) - Number(Boolean(right?.enabled))
        if (statusDiff !== 0) {
          return sortDir === 'asc' ? statusDiff : -statusDiff
        }
      }
      const compare = leftType.localeCompare(rightType)
      return sortDir === 'asc' ? compare : -compare
    })

    return sorted
  }, [draftRows, query, statusFilter, sortBy, sortDir])

  const hasChanges = useMemo(() => {
    if (rows.length !== draftRows.length) {
      return true
    }
    const original = new Map(rows.map((row) => [String(row?.game_type || ''), Boolean(row?.enabled)]))
    for (const row of draftRows) {
      const key = String(row?.game_type || '')
      if (original.get(key) !== Boolean(row?.enabled)) {
        return true
      }
    }
    return false
  }, [rows, draftRows])

  function updateDraft(type, enabled) {
    setDraftRows((previous) => previous.map((row) => (
      String(row?.game_type || '') === type ? { ...row, enabled } : row
    )))
  }

  function applyBulkToVisible(enabled) {
    const visibleTypes = new Set(filteredRows.map((row) => String(row?.game_type || '')))
    setDraftRows((previous) => previous.map((row) => (
      visibleTypes.has(String(row?.game_type || '')) ? { ...row, enabled } : row
    )))
  }

  function discardChanges() {
    setDraftRows(rows)
  }

  async function saveChanges() {
    const nextEnabledTypes = draftRows
      .map((row) => ({ game_type: String(row.game_type || ''), enabled: Boolean(row.enabled) }))
      .filter((row) => row.enabled)
      .map((row) => row.game_type)

    setSaving(true)
    setError('')
    try {
      const payload = await superAdminApi.updateGameTypeAvailability(session.token, nextEnabledTypes)
      const updated = Array.isArray(payload?.game_types) ? payload.game_types : []
      setRows(updated)
      setDraftRows(updated)
    } catch (err) {
      setError(err.message || 'Failed to update mode')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card panel">Loading game mode availability…</div>
  }

  return (
    <div className="card panel">
      <div className="panel-header">
        <h3>Enabled Game Types</h3>
        <div className="actions-inline">
          <button className="ghost" onClick={load} disabled={saving}>Refresh</button>
          <button className="ghost" onClick={() => applyBulkToVisible(true)} disabled={saving || filteredRows.length === 0}>Enable visible</button>
          <button className="ghost" onClick={() => applyBulkToVisible(false)} disabled={saving || filteredRows.length === 0}>Disable visible</button>
          <button className="ghost" onClick={discardChanges} disabled={saving || !hasChanges}>Discard</button>
          <button className="btn-success" onClick={saveChanges} disabled={saving || !hasChanges}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>

      <div className="toolbar-grid">
        <input
          type="text"
          placeholder="Search game mode…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="game_type">Sort by type</option>
          <option value="status">Sort by status</option>
        </select>
        <select value={sortDir} onChange={(event) => setSortDir(event.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      <p className="muted small">Showing {filteredRows.length} of {draftRows.length} modes {hasChanges ? '• Unsaved changes' : ''}</p>
      <div className="list">
        {filteredRows.map((row) => {
          const type = String(row?.game_type || '')
          const enabled = Boolean(row?.enabled)
          return (
            <div className="list-row" key={type}>
              <div>
                <p className="strong">{type}</p>
                <p className="muted small">Global availability</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => updateDraft(type, event.target.checked)}
                  disabled={saving}
                />
                <span>{enabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UsersPage({ session }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('email')
  const [sortDir, setSortDir] = useState('asc')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const payload = await superAdminApi.listUsers(session.token)
      const rows = Array.isArray(payload?.users) ? payload.users : []
      setUsers(rows)
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const availableRoles = useMemo(() => {
    const values = new Set()
    for (const user of users) {
      const roles = Array.isArray(user?.roles) ? user.roles : []
      for (const role of roles) {
        if (String(role || '').trim()) {
          values.add(String(role))
        }
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [users])

  const processedUsers = useMemo(() => {
    const q = normalizeText(query)
    const filtered = users.filter((user) => {
      const email = normalizeText(user?.email)
      const username = normalizeText(user?.username)
      const id = normalizeText(user?.id)
      const roles = Array.isArray(user?.roles) ? user.roles : []
      const isVerified = Boolean(user?.is_verified)

      const queryMatches = !q || email.includes(q) || username.includes(q) || id.includes(q)
      const roleMatches = roleFilter === 'all' || roles.includes(roleFilter)
      const verifiedMatches = verifiedFilter === 'all' || (verifiedFilter === 'verified' ? isVerified : !isVerified)
      return queryMatches && roleMatches && verifiedMatches
    })

    const sorted = [...filtered].sort((left, right) => {
      const getComparable = (record) => {
        if (sortBy === 'username') {
          return String(record?.username || '').toLowerCase()
        }
        if (sortBy === 'created_at') {
          return String(record?.created_at || '')
        }
        if (sortBy === 'updated_at') {
          return String(record?.updated_at || '')
        }
        if (sortBy === 'role_count') {
          return Number(Array.isArray(record?.roles) ? record.roles.length : 0)
        }
        return String(record?.email || '').toLowerCase()
      }

      const a = getComparable(left)
      const b = getComparable(right)

      let compare = 0
      if (typeof a === 'number' && typeof b === 'number') {
        compare = a - b
      } else {
        compare = String(a).localeCompare(String(b))
      }
      return sortDir === 'asc' ? compare : -compare
    })

    return sorted
  }, [users, query, roleFilter, verifiedFilter, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(processedUsers.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedUsers = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return processedUsers.slice(start, start + pageSize)
  }, [processedUsers, safePage, pageSize])

  const selectedUser = useMemo(() => {
    return processedUsers.find((user) => String(user?.id || '') === String(selectedUserId || '')) || null
  }, [processedUsers, selectedUserId])

  useEffect(() => {
    setPage(1)
  }, [query, roleFilter, verifiedFilter, sortBy, sortDir, pageSize])

  function exportFilteredCsv() {
    const header = ['id', 'email', 'username', 'roles', 'is_verified', 'created_at', 'updated_at', 'last_login_at']
    const lines = [header.join(',')]
    for (const user of processedUsers) {
      const line = [
        toCsvValue(user?.id),
        toCsvValue(user?.email),
        toCsvValue(user?.username),
        toCsvValue(Array.isArray(user?.roles) ? user.roles.join('|') : ''),
        toCsvValue(Boolean(user?.is_verified)),
        toCsvValue(user?.created_at),
        toCsvValue(user?.updated_at),
        toCsvValue(user?.last_login_at),
      ]
      lines.push(line.join(','))
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'jotigames-users.csv'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="card panel">Loading users…</div>
  }

  return (
    <div className="card panel">
      <div className="panel-header">
        <h3>Users</h3>
        <div className="actions-inline">
          <Link className="quick-link" to="/dashboard/users/new">Create user</Link>
          <button className="ghost" onClick={load}>Refresh</button>
          <button className="ghost" onClick={exportFilteredCsv} disabled={processedUsers.length === 0}>Export CSV</button>
        </div>
      </div>

      <div className="toolbar-grid users-toolbar">
        <input
          type="text"
          placeholder="Search by email, username, or id…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="all">All roles</option>
          {availableRoles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select value={verifiedFilter} onChange={(event) => setVerifiedFilter(event.target.value)}>
          <option value="all">All verification statuses</option>
          <option value="verified">Verified only</option>
          <option value="unverified">Unverified only</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="email">Sort by email</option>
          <option value="username">Sort by username</option>
          <option value="created_at">Sort by created</option>
          <option value="updated_at">Sort by updated</option>
          <option value="role_count">Sort by role count</option>
        </select>
        <select value={sortDir} onChange={(event) => setSortDir(event.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <select value={String(pageSize)} onChange={(event) => setPageSize(Number(event.target.value || 25))}>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      <p className="muted small">Showing {processedUsers.length} users • Page {safePage} of {totalPages}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Username</th>
              <th>Roles</th>
              <th>Verified</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map((user) => (
              <tr key={String(user.id || user.email || Math.random())}>
                <td>{String(user.email || '-')}</td>
                <td>{String(user.username || '-')}</td>
                <td>
                  <div className="role-pills">
                    {Array.isArray(user.roles) && user.roles.length > 0
                      ? user.roles.map((role) => <span className="pill" key={`${user.id}-${role}`}>{role}</span>)
                      : <span className="muted small">-</span>}
                  </div>
                </td>
                <td>{user.is_verified ? 'Yes' : 'No'}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>{formatDate(user.updated_at)}</td>
                <td>
                  <div className="actions-inline">
                    <button className="ghost" onClick={() => setSelectedUserId(String(user?.id || ''))}>View</button>
                    <Link className="quick-link" to={`/dashboard/users/${String(user?.id || '')}/edit`}>Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="ghost" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
        <span className="muted">Page {safePage} / {totalPages}</span>
        <button className="ghost" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
      </div>

      {selectedUser ? (
        <div className="card user-detail">
          <div className="panel-header">
            <h3>User detail</h3>
            <button className="ghost" onClick={() => setSelectedUserId('')}>Close</button>
          </div>
          <div className="detail-grid">
            <p><strong>ID:</strong> {String(selectedUser.id || '-')}</p>
            <p><strong>Email:</strong> {String(selectedUser.email || '-')}</p>
            <p><strong>Username:</strong> {String(selectedUser.username || '-')}</p>
            <p><strong>Roles:</strong> {Array.isArray(selectedUser.roles) ? selectedUser.roles.join(', ') : '-'}</p>
            <p><strong>Verified:</strong> {selectedUser.is_verified ? 'Yes' : 'No'}</p>
            <p><strong>Created:</strong> {formatDate(selectedUser.created_at)}</p>
            <p><strong>Updated:</strong> {formatDate(selectedUser.updated_at)}</p>
            <p><strong>Last login:</strong> {formatDate(selectedUser.last_login_at)}</p>
            <p><strong>Pending email:</strong> {String(selectedUser.pending_email || '-')}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => readSession())
  const [checking, setChecking] = useState(true)

  const isLoggedIn = useMemo(() => {
    return Boolean(session?.token) && hasSuperAdminRole(session)
  }, [session])

  useEffect(() => {
    let cancelled = false

    async function verifySession() {
      if (!session?.token || !hasSuperAdminRole(session)) {
        if (!cancelled) {
          setChecking(false)
        }
        return
      }

      try {
        await superAdminApi.listUsers(session.token)
        if (!cancelled) {
          setChecking(false)
        }
      } catch (error) {
        const statusCode = Number(error?.status)
        const unauthorized = statusCode === 401 || statusCode === 403
        if (unauthorized) {
          clearSession()
        }
        if (!cancelled) {
          if (unauthorized) {
            setSession(null)
          }
          setChecking(false)
        }
      }
    }

    verifySession()

    return () => {
      cancelled = true
    }
  }, [])

  function handleLogin(nextSession) {
    setSession(nextSession)
    navigate('/dashboard')
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    navigate('/login')
  }

  if (checking) {
    return <LoadingScreen label="Verifying session…" />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="/dashboard/*"
        element={isLoggedIn ? <DashboardLayout session={session} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
