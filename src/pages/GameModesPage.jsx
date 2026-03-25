import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, Save, Undo2, ToggleLeft, ToggleRight } from 'lucide-react'
import { superAdminApi } from '@/lib/api'
import { normalizeText } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export default function GameModesPage({ session }) {
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

    return [...base].sort((left, right) => {
      const leftType = String(left?.game_type || '')
      const rightType = String(right?.game_type || '')
      if (sortBy === 'status') {
        const diff = Number(Boolean(left?.enabled)) - Number(Boolean(right?.enabled))
        if (diff !== 0) return sortDir === 'asc' ? diff : -diff
      }
      const cmp = leftType.localeCompare(rightType)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [draftRows, query, statusFilter, sortBy, sortDir])

  const hasChanges = useMemo(() => {
    if (rows.length !== draftRows.length) return true
    const original = new Map(rows.map((r) => [String(r?.game_type || ''), Boolean(r?.enabled)]))
    for (const r of draftRows) {
      if (original.get(String(r?.game_type || '')) !== Boolean(r?.enabled)) return true
    }
    return false
  }, [rows, draftRows])

  function updateDraft(type, enabled) {
    setDraftRows((prev) => prev.map((r) => String(r?.game_type || '') === type ? { ...r, enabled } : r))
  }

  function applyBulkToVisible(enabled) {
    const visible = new Set(filteredRows.map((r) => String(r?.game_type || '')))
    setDraftRows((prev) => prev.map((r) => visible.has(String(r?.game_type || '')) ? { ...r, enabled } : r))
  }

  function discardChanges() {
    setDraftRows(rows)
  }

  async function saveChanges() {
    const nextEnabled = draftRows
      .filter((r) => Boolean(r.enabled))
      .map((r) => String(r.game_type || ''))

    setSaving(true)
    setError('')
    try {
      const payload = await superAdminApi.updateGameTypeAvailability(session.token, nextEnabled)
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
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base">Enabled Game Types</CardTitle>
            <CardDescription>
              {filteredRows.length} of {draftRows.length} modes shown
              {hasChanges && <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">• Unsaved changes</span>}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={load} disabled={saving}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button variant="ghost" size="sm" onClick={() => applyBulkToVisible(true)} disabled={saving || filteredRows.length === 0}>
              <ToggleRight className="h-3.5 w-3.5 mr-1" />
              Enable visible
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyBulkToVisible(false)} disabled={saving || filteredRows.length === 0}>
              <ToggleLeft className="h-3.5 w-3.5 mr-1" />
              Disable visible
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button variant="outline" size="sm" onClick={discardChanges} disabled={saving || !hasChanges}>
              <Undo2 className="h-3.5 w-3.5 mr-1" />
              Discard
            </Button>
            <Button variant="success" size="sm" onClick={saveChanges} disabled={saving || !hasChanges}>
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search game mode…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="game_type">Sort by type</option>
            <option value="status">Sort by status</option>
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

        {/* Game Mode List */}
        <div className="space-y-2">
          {filteredRows.map((row) => {
            const type = String(row?.game_type || '')
            const enabled = Boolean(row?.enabled)
            return (
              <div
                key={type}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-all duration-150 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{type.replaceAll('_', ' ')}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={enabled ? 'success' : 'secondary'}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => updateDraft(type, !enabled)}
                    disabled={saving}
                    className={`
                      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                      transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                      disabled:cursor-not-allowed disabled:opacity-50
                      ${enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0
                        transition-transform duration-200 ease-in-out
                        ${enabled ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>
            )
          })}

          {filteredRows.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
              No game modes match the current filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
