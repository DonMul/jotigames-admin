import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, Eye,
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
                  const now = new Date()
                  const start = new Date(g.start_at)
                  const end = new Date(g.end_at)
                  const isActive = now >= start && now <= end
                  const isPast = now > end
                  const statusLabel = isActive ? 'Active' : isPast ? 'Ended' : 'Upcoming'
                  const statusVariant = isActive ? 'success' : isPast ? 'outline' : 'secondary'

                  return (
                    <TableRow key={gid}>
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
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/dashboard/games/${gid}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                    </TableRow>
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
