import { useEffect, useState } from 'react'
import { Gamepad2, Users, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react'
import { superAdminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({ icon: Icon, label, value, sublabel, color = 'blue' }) {
  const iconColorMap = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
  }

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColorMap[color]} transition-transform duration-200 group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OverviewPage({ session }) {
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

  const enabledModeCount = modeRows.filter((r) => Boolean(r?.enabled)).length
  const disabledModeCount = Math.max(0, modeRows.length - enabledModeCount)
  const superAdminCount = users.filter((u) => Array.isArray(u?.roles) && u.roles.includes('ROLE_SUPER_ADMIN')).length
  const verifiedCount = users.filter((u) => Boolean(u?.is_verified)).length
  const verifiedPercent = users.length > 0 ? Math.round((verifiedCount / users.length) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Gamepad2}
          label="Game Modes"
          value={enabledModeCount}
          sublabel={`${disabledModeCount} disabled`}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={users.length}
          sublabel={`${verifiedPercent}% verified`}
          color="emerald"
        />
        <StatCard
          icon={ShieldCheck}
          label="Super Admins"
          value={superAdminCount}
          sublabel="Platform-wide access"
          color="violet"
        />
        <StatCard
          icon={CheckCircle2}
          label="Verified Users"
          value={verifiedCount}
          sublabel="Ready for authenticated usage"
          color="amber"
        />
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={loadSummary}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
    </div>
  )
}
