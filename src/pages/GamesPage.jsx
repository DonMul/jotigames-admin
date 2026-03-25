import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, Eye, ChevronDown, X,
  Users as UsersIcon, Gamepad2, Clock, RotateCcw, Trash2, Radio,
} from 'lucide-react'
import { gameApi } from '@/lib/api'
import { formatDate, normalizeText, gameTypeDisplayName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

function GameDetailInline({ game, token, onClose }) {
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const gameId = String(game?.id || '')
  const gameType = String(game?.game_type || game?.type || '')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [teamsResult, membersResult, overviewResult] = await Promise.allSettled([
          gameApi.listTeams(token, gameId),
          gameApi.listMembers(token, gameId),
          gameApi.getOverview(token, gameType, gameId),
        ])
        if (cancelled) return
        setTeams(teamsResult.status === 'fulfilled' ? teamsResult.value : [])
        setMembers(membersResult.status === 'fulfilled' ? membersResult.value : [])
        setOverview(overviewResult.status === 'fulfilled' ? overviewResult.value : null)
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [gameId, gameType, token])

  function clearMessages() {
    setActionError('')
    setActionSuccess('')
  }

  async function handleResetGame() {
    if (!window.confirm('Reset this game? All runtime progress will be lost.')) return
    clearMessages()
    try {
      await gameApi.resetGame(token, gameId)
      setActionSuccess('Game reset successfully')
    } catch (err) {
      setActionError(err.message || 'Failed to reset game')
    }
  }

  async function handleDeleteTeam(teamId, teamName) {
    if (!window.confirm(`Delete team "${teamName}"?`)) return
    clearMessages()
    try {
      await gameApi.deleteTeam(token, gameId, teamId)
      setTeams((prev) => prev.filter((t) => String(t?.id) !== String(teamId)))
      setActionSuccess(`Team "${teamName}" deleted`)
    } catch (err) {
      setActionError(err.message || 'Failed to delete team')
    }
  }

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const scoreA = Number(a?.geo_score || a?.blindhike_markers || a?.score || 0)
      const scoreB = Number(b?.geo_score || b?.blindhike_markers || b?.score || 0)
      if (scoreB !== scoreA) return scoreB - scoreA
      return String(a?.name || '').localeCompare(String(b?.name || ''))
    })
  }, [teams])

  const overviewSummary = useMemo(() => {
    if (!overview) return null
    const items = []
    if (Array.isArray(overview.teams)) items.push(`${overview.teams.length} team states`)
    if (Array.isArray(overview.markers)) items.push(`${overview.markers.length} markers`)
    if (Array.isArray(overview.points)) items.push(`${overview.points.length} points`)
    if (Array.isArray(overview.eggs)) items.push(`${overview.eggs.length} eggs`)
    if (Array.isArray(overview.pois)) items.push(`${overview.pois.length} POIs`)
    if (Array.isArray(overview.nodes)) items.push(`${overview.nodes.length} nodes`)
    if (Array.isArray(overview.zones)) items.push(`${overview.zones.length} zones`)
    if (Array.isArray(overview.beacons)) items.push(`${overview.beacons.length} beacons`)
    if (Array.isArray(overview.checkpoints)) items.push(`${overview.checkpoints.length} checkpoints`)
    if (Array.isArray(overview.hotspots)) items.push(`${overview.hotspots.length} hotspots`)
    if (Array.isArray(overview.pickups)) items.push(`${overview.pickups.length} pickups`)
    if (Array.isArray(overview.dropoffs)) items.push(`${overview.dropoffs.length} dropoffs`)
    if (overview.target) items.push('target set')
    return items.length > 0 ? items.join(' · ') : 'No overview data'
  }, [overview])

  if (loading) {
    return (
      <TableRow className="bg-slate-50/80">
        <TableCell colSpan={6} className="p-6">
          <Skeleton className="h-32 w-full" />
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
      <TableCell colSpan={6} className="p-0">
        <div className="px-6 py-5 space-y-5 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Game Detail</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetGame}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset game
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Feedback */}
          {actionError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">{actionError}</div>
          )}
          {actionSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300">{actionSuccess}</div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              ['ID', String(game.id || '-'), true],
              ['Code', String(game.code || '-'), true],
              ['Type', gameTypeDisplayName(gameType)],
              ['Start', formatDate(game.start_at)],
              ['End', formatDate(game.end_at)],
            ].map(([label, value, mono]) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                <p className={`text-sm text-slate-700 dark:text-slate-300 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Overview Summary */}
          {overviewSummary && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Live Overview</p>
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-sm text-slate-600 dark:text-slate-400">{overviewSummary}</p>
              </div>
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Members</p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-slate-700 dark:text-slate-300">{String(m.email || m.user_id)}</p>
                    <div className="flex gap-1">
                      {(Array.isArray(m.roles) ? m.roles : []).map((r) => (
                        <Badge key={`${m.user_id}-${r}`} variant={r === 'owner' ? 'default' : 'secondary'} className="text-[10px] px-1.5">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Teams ({teams.length})
            </p>
            {teams.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">No teams in this game.</p>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Lives</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTeams.map((t) => {
                      const tid = String(t.id || '')
                      const score = Number(t.geo_score || t.blindhike_markers || t.score || 0)
                      return (
                        <TableRow key={tid}>
                          <TableCell className="text-sm font-medium">{String(t.name || '-')}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{String(t.code || '-')}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{score}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{String(t.lives ?? '-')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTeam(tid, t.name)}
                              className="h-7 w-7 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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

export default function GamesPage({ session }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [games, setGames] = useState([])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [expandedGameId, setExpandedGameId] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await gameApi.listGames(session.token)
      setGames(Array.isArray(result) ? result : [])
    } catch (err) {
      setError(err.message || 'Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const availableTypes = useMemo(() => {
    const types = new Set()
    for (const g of games) {
      const t = String(g?.type || g?.game_type || '').trim()
      if (t) types.add(t)
    }
    return Array.from(types).sort()
  }, [games])

  const processedGames = useMemo(() => {
    const q = normalizeText(query)
    const filtered = games.filter((g) => {
      const name = normalizeText(g?.name)
      const id = normalizeText(g?.id)
      const type = String(g?.type || g?.game_type || '')
      const queryOk = !q || name.includes(q) || id.includes(q) || normalizeText(type).includes(q)
      const typeOk = typeFilter === 'all' || type === typeFilter
      return queryOk && typeOk
    })

    return [...filtered].sort((a, b) => {
      const getVal = (r) => {
        if (sortBy === 'type') return gameTypeDisplayName(String(r?.type || r?.game_type || '')).toLowerCase()
        if (sortBy === 'start_at') return String(r?.start_at || '')
        if (sortBy === 'end_at') return String(r?.end_at || '')
        return String(r?.name || '').toLowerCase()
      }
      const va = getVal(a)
      const vb = getVal(b)
      const cmp = String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [games, query, typeFilter, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(processedGames.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedGames = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return processedGames.slice(start, start + pageSize)
  }, [processedGames, safePage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [query, typeFilter, sortBy, sortDir, pageSize])

  function toggleExpanded(gameId) {
    setExpandedGameId((prev) => (prev === gameId ? '' : gameId))
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
              <CardTitle className="text-base">All Games</CardTitle>
              <CardDescription>
                {processedGames.length} games • Page {safePage} of {totalPages}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search by name, ID, or type…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All game types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>{gameTypeDisplayName(t)}</option>
              ))}
            </Select>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by name</option>
              <option value="type">Sort by type</option>
              <option value="start_at">Sort by start</option>
              <option value="end_at">Sort by end</option>
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
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedGames.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                    No games match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                pagedGames.map((g) => {
                  const gid = String(g.id || '')
                  const gtype = String(g.type || g.game_type || '')
                  const isExpanded = expandedGameId === gid
                  const now = new Date()
                  const start = new Date(g.start_at)
                  const end = new Date(g.end_at)
                  const isActive = now >= start && now <= end
                  const isPast = now > end
                  const statusLabel = isActive ? 'Active' : isPast ? 'Ended' : 'Upcoming'
                  const statusVariant = isActive ? 'success' : isPast ? 'outline' : 'secondary'

                  return (
                    <>{/* Fragment key on wrapper */}
                      <TableRow key={gid} className={isExpanded ? 'bg-slate-50/60 dark:bg-slate-800/40' : ''}>
                        <TableCell className="font-medium">{String(g.name || '-')}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{gameTypeDisplayName(gtype)}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(g.start_at)}</TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(g.end_at)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleExpanded(gid)}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <GameDetailInline
                          key={`detail-${gid}`}
                          game={g}
                          token={session.token}
                          onClose={() => setExpandedGameId('')}
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
