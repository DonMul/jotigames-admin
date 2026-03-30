import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Eye, Radio, RefreshCw } from 'lucide-react'
import { gameApi } from '@/lib/api'
import { formatDate, gameTypeDisplayName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

function getMainSiteBaseUrl() {
  const configured = String(import.meta.env.VITE_MAIN_SITE_BASE_URL || '').trim()
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    if (import.meta.env.DEV) {
      return `${protocol}//${hostname}:5173`
    }
    return `${protocol}//${hostname}`
  }
  return ''
}

export default function GameOverviewPage({ session }) {
  const { gameId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [game, setGame] = useState(null)
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [overview, setOverview] = useState(null)

  const gameType = String(game?.type || game?.game_type || '')
  const mainSiteUrl = useMemo(() => {
    const base = getMainSiteBaseUrl()
    if (!base || !gameId) return ''
    return `${base}/admin/games/${gameId}`
  }, [gameId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const gameRes = await gameApi.getGame(session.token, gameId)
      const resolvedGame = gameRes || null
      setGame(resolvedGame)

      if (!resolvedGame) {
        setTeams([])
        setMembers([])
        setOverview(null)
      } else {
        const resolvedType = String(resolvedGame.type || resolvedGame.game_type || '')
        const [teamsRes, membersRes, overviewRes] = await Promise.allSettled([
          gameApi.listTeams(session.token, gameId),
          gameApi.listMembers(session.token, gameId),
          gameApi.getOverview(session.token, resolvedType, gameId),
        ])
        setTeams(teamsRes.status === 'fulfilled' ? teamsRes.value : [])
        setMembers(membersRes.status === 'fulfilled' ? membersRes.value : [])
        setOverview(overviewRes.status === 'fulfilled' ? overviewRes.value : null)
      }
    } catch (err) {
      setError(err.message || 'Failed to load game overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [gameId])

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const scoreA = Number(a?.geo_score || a?.blindhike_markers || a?.score || 0)
      const scoreB = Number(b?.geo_score || b?.blindhike_markers || b?.score || 0)
      if (scoreB !== scoreA) return scoreB - scoreA
      return String(a?.name || '').localeCompare(String(b?.name || ''))
    })
  }, [teams])

  const overviewSummary = useMemo(() => {
    if (!overview) return ''
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
    return items.join(' · ')
  }, [overview])

  const ownerMember = useMemo(() => {
    return members.find((member) => (Array.isArray(member?.roles) ? member.roles : []).includes('owner')) || null
  }, [members])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (!game) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500 dark:text-slate-400">Game not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/dashboard/games"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to games
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          {mainSiteUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={mainSiteUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Open in main site editor
              </a>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{String(game.name || 'Untitled game')}</CardTitle>
            <CardDescription>Dedicated game overview with runtime and team information.</CardDescription>
            {ownerMember?.user_id && (
              <div className="mt-2">
                <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                  <Link to={`/dashboard/users/${String(ownerMember.user_id)}`}>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View owner user
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {overviewSummary && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Live Overview</p>
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-sm text-slate-600 dark:text-slate-400">{overviewSummary}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{members.length} member(s) attached to this game.</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No members in this game.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <div key={String(member?.user_id || Math.random())} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1 dark:bg-slate-800 dark:border-slate-700">
                  {member?.user_id ? (
                    <Link
                      to={`/dashboard/users/${String(member.user_id)}`}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {String(member?.email || member?.user_id || '-')}
                    </Link>
                  ) : (
                    <p className="text-xs text-slate-700 dark:text-slate-300">{String(member?.email || member?.user_id || '-')}</p>
                  )}
                  <div className="flex gap-1">
                    {(Array.isArray(member?.roles) ? member.roles : []).map((role) => (
                      <Badge key={`${member.user_id}-${role}`} variant={role === 'owner' ? 'default' : 'secondary'} className="text-[10px] px-1.5">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>{teams.length} team(s) in this game.</CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No teams in this game.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Lives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeams.map((team) => {
                  const teamId = String(team?.id || '')
                  const score = Number(team?.geo_score || team?.blindhike_markers || team?.score || 0)
                  return (
                    <TableRow key={teamId}>
                      <TableCell className="font-medium">{String(team?.name || '-')}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{String(team?.code || '-')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{score}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{String(team?.lives ?? '-')}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
