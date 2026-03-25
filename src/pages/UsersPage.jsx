import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, RefreshCw, Download, UserPlus, ChevronLeft, ChevronRight, X, Eye, Pencil, ChevronDown,
} from 'lucide-react'
import { superAdminApi } from '@/lib/api'
import { formatDate, normalizeText, toCsvValue, roleDisplayName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

function UserDetailInline({ user, token, onClose }) {
  const [games, setGames] = useState([])
  const [gamesLoading, setGamesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchGames() {
      setGamesLoading(true)
      try {
        const payload = await superAdminApi.getUserGames(token, user.id)
        if (!cancelled) setGames(Array.isArray(payload?.games) ? payload.games : [])
      } catch { /* ignore */ }
      if (!cancelled) setGamesLoading(false)
    }
    fetchGames()
    return () => { cancelled = true }
  }, [user.id, token])

  return (
    <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
      <TableCell colSpan={7} className="p-0">
        <div className="px-6 py-5 space-y-5 animate-fade-in">
          {/* Close Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">User Detail</p>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              ['ID', user.id, true],
              ['Email', user.email],
              ['Username', user.username],
              ['Roles', Array.isArray(user.roles) ? user.roles.map(roleDisplayName).join(', ') : '-'],
              ['Verified', user.is_verified ? 'Yes' : 'No'],
              ['Created', formatDate(user.created_at)],
              ['Updated', formatDate(user.updated_at)],
              ['Last login', formatDate(user.last_login_at)],
              ['Pending email', user.pending_email || '-'],
            ].map(([label, value, mono]) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                <p className={`text-sm text-slate-700 dark:text-slate-300 ${mono ? 'font-mono text-xs' : ''}`}>
                  {String(value || '-')}
                </p>
              </div>
            ))}
          </div>

          {/* Owned Games */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Owned Games</p>
            {gamesLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : games.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">No games owned by this user.</p>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Start</TableHead>
                      <TableHead className="text-xs">End</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map((g, i) => (
                      <TableRow key={String(g.id || i)}>
                        <TableCell className="text-sm font-medium">{String(g.name || '-')}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {String(g.game_type || '-')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(g.start_at)}</TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(g.end_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function UsersPage({ session }) {
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
  const [expandedUserId, setExpandedUserId] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const payload = await superAdminApi.listUsers(session.token)
      setUsers(Array.isArray(payload?.users) ? payload.users : [])
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
    for (const u of users) {
      for (const r of Array.isArray(u?.roles) ? u.roles : []) {
        if (String(r || '').trim()) values.add(String(r))
      }
    }
    return Array.from(values).sort()
  }, [users])

  const processedUsers = useMemo(() => {
    const q = normalizeText(query)
    const filtered = users.filter((u) => {
      const email = normalizeText(u?.email)
      const username = normalizeText(u?.username)
      const id = normalizeText(u?.id)
      const roles = Array.isArray(u?.roles) ? u.roles : []
      const isVerified = Boolean(u?.is_verified)
      const queryOk = !q || email.includes(q) || username.includes(q) || id.includes(q)
      const roleOk = roleFilter === 'all' || roles.includes(roleFilter)
      const verifiedOk = verifiedFilter === 'all' || (verifiedFilter === 'verified' ? isVerified : !isVerified)
      return queryOk && roleOk && verifiedOk
    })

    return [...filtered].sort((a, b) => {
      const getVal = (r) => {
        if (sortBy === 'username') return String(r?.username || '').toLowerCase()
        if (sortBy === 'created_at') return String(r?.created_at || '')
        if (sortBy === 'updated_at') return String(r?.updated_at || '')
        if (sortBy === 'role_count') return Number(Array.isArray(r?.roles) ? r.roles.length : 0)
        return String(r?.email || '').toLowerCase()
      }
      const va = getVal(a), vb = getVal(b)
      let cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [users, query, roleFilter, verifiedFilter, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(processedUsers.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedUsers = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return processedUsers.slice(start, start + pageSize)
  }, [processedUsers, safePage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [query, roleFilter, verifiedFilter, sortBy, sortDir, pageSize])

  function toggleExpanded(userId) {
    setExpandedUserId((prev) => (prev === userId ? '' : userId))
  }

  function exportFilteredCsv() {
    const header = ['id', 'email', 'username', 'roles', 'is_verified', 'created_at', 'updated_at', 'last_login_at']
    const lines = [header.join(',')]
    for (const u of processedUsers) {
      lines.push([
        toCsvValue(u?.id), toCsvValue(u?.email), toCsvValue(u?.username),
        toCsvValue(Array.isArray(u?.roles) ? u.roles.join('|') : ''),
        toCsvValue(Boolean(u?.is_verified)), toCsvValue(u?.created_at),
        toCsvValue(u?.updated_at), toCsvValue(u?.last_login_at),
      ].join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jotigames-users.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base">Users</CardTitle>
              <CardDescription>
                {processedUsers.length} users • Page {safePage} of {totalPages}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" asChild>
                <Link to="/dashboard/users/new">
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Create user
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={exportFilteredCsv} disabled={processedUsers.length === 0}>
                <Download className="h-3.5 w-3.5 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search by email, username, or ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All roles</option>
              {availableRoles.map((r) => <option key={r} value={r}>{roleDisplayName(r)}</option>)}
            </Select>
            <Select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </Select>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="email">Sort by email</option>
              <option value="username">Sort by username</option>
              <option value="created_at">Sort by created</option>
              <option value="updated_at">Sort by updated</option>
              <option value="role_count">Sort by role count</option>
            </Select>
            <Select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No users match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                pagedUsers.map((u) => {
                  const uid = String(u.id || u.email || Math.random())
                  const isExpanded = expandedUserId === uid
                  return (
                    <>{/* Fragment key on wrapper */}
                      <TableRow key={uid} className={isExpanded ? 'bg-slate-50/60 dark:bg-slate-800/40' : ''}>
                        <TableCell className="font-medium">{String(u.email || '-')}</TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400">{String(u.username || '-')}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(u.roles) && u.roles.length > 0
                              ? u.roles.map((r) => (
                                  <Badge key={`${u.id}-${r}`} variant={r === 'ROLE_SUPER_ADMIN' ? 'default' : r === 'ROLE_ADMIN' ? 'default' : 'secondary'}>
                                    {roleDisplayName(r)}
                                  </Badge>
                                ))
                              : <span className="text-xs text-slate-400 dark:text-slate-500">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_verified ? 'success' : 'outline'}>
                            {u.is_verified ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(u.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleExpanded(uid)}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/dashboard/users/${String(u?.id || '')}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <UserDetailInline
                          key={`detail-${uid}`}
                          user={u}
                          token={session.token}
                          onClose={() => setExpandedUserId('')}
                        />
                      )}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Rows per page</span>
              <Select
                className="w-20"
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value || 25))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {safePage} of {totalPages}
              </span>
              <Button variant="outline" size="icon" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
