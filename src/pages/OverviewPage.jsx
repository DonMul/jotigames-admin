import { useEffect, useState, useCallback } from 'react'
import { Gamepad2, Users, ShieldCheck, CheckCircle2, RefreshCw, TrendingUp, CreditCard, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { superAdminApi, subscriptionApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, sublabel, color = 'blue' }) {
  const iconColorMap = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
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
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColorMap[color] || iconColorMap.blue} transition-transform duration-200 group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Currency formatting ─────────────────────────────────────────────────────

function formatCents(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
}

// ── Revenue Overview Section ────────────────────────────────────────────────

const STATUS_COLORS = {
  active: { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', light: 'bg-emerald-100 dark:bg-emerald-900/30' },
  past_due: { bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', light: 'bg-amber-100 dark:bg-amber-900/30' },
  cancelled: { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-400', light: 'bg-red-100 dark:bg-red-900/30' },
}

const PLAN_COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', light: 'bg-blue-100 dark:bg-blue-900/30' },
  { bg: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', light: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { bg: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-400', light: 'bg-violet-100 dark:bg-violet-900/30' },
  { bg: 'bg-fuchsia-500', text: 'text-fuchsia-700 dark:text-fuchsia-400', light: 'bg-fuchsia-100 dark:bg-fuchsia-900/30' },
  { bg: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-400', light: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { bg: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-400', light: 'bg-teal-100 dark:bg-teal-900/30' },
]

function StatusBadge({ status }) {
  const variants = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    past_due: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    succeeded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  const cls = variants[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{status}</span>
}

function RevenueOverview({ token }) {
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState(null)
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [monetisationEnabled, setMonetisationEnabled] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, revenueRes, plansRes, subsRes, paymentsRes] = await Promise.all([
        subscriptionApi.monetisationStatus().catch(() => null),
        subscriptionApi.revenue(token).catch(() => null),
        subscriptionApi.listPlans(token).catch(() => null),
        subscriptionApi.listSubscriptions(token).catch(() => null),
        subscriptionApi.listPayments(token, { limit: 10 }).catch(() => null),
      ])
      setMonetisationEnabled(statusRes?.enabled ?? false)
      setRevenue(revenueRes)
      setPlans(plansRes?.plans || [])
      setSubscriptions(subsRes?.subscriptions || [])
      setPayments(paymentsRes?.payments || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (monetisationEnabled === false) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-8 text-center">
          <DollarSign className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monetisation is disabled</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Enable via <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">ENABLE_MONETISATION=true</code> to see revenue data.</p>
        </CardContent>
      </Card>
    )
  }

  // ── Compute metrics ─────────────────────────────────────────────────

  const summaryGroups = revenue?.summary || []
  const totalRevenueCents = summaryGroups.reduce((sum, g) => sum + (g.total_cents || 0), 0)
  const totalTransactions = summaryGroups.reduce((sum, g) => sum + (g.count || 0), 0)
  const projectedCents = revenue?.projected?.total_cents || 0
  const activeSubs = revenue?.active_subscriptions || 0
  const totalSubs = revenue?.total_subscriptions || 0
  const avgRevPerSub = activeSubs > 0 ? Math.round(totalRevenueCents / activeSubs) : 0
  const currency = summaryGroups[0]?.currency || 'EUR'

  // Plan distribution from subscriptions
  const planMap = {}
  for (const p of plans) {
    planMap[p.id] = p
  }
  const planDistribution = {}
  const statusDistribution = { active: 0, past_due: 0, cancelled: 0 }
  for (const sub of subscriptions) {
    const planName = planMap[sub.plan_id]?.name || 'Unknown'
    planDistribution[planName] = (planDistribution[planName] || 0) + 1
    if (statusDistribution[sub.status] !== undefined) {
      statusDistribution[sub.status] += 1
    } else {
      statusDistribution[sub.status] = (statusDistribution[sub.status] || 0) + 1
    }
  }
  const planEntries = Object.entries(planDistribution).sort((a, b) => b[1] - a[1])
  const statusEntries = Object.entries(statusDistribution).filter(([, v]) => v > 0)
  const maxPlanCount = Math.max(...planEntries.map(([, v]) => v), 1)

  // Revenue by type for horizontal bars
  const typeLabels = { subscription: 'Subscriptions', topup: 'Top-ups' }
  const maxGroupCents = Math.max(...summaryGroups.map(g => g.total_cents || 0), 1)

  return (
    <div className="space-y-4">
      {/* Revenue KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCents(totalRevenueCents, currency)}
          sublabel={`${totalTransactions} transaction${totalTransactions !== 1 ? 's' : ''}`}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Projected Revenue"
          value={formatCents(projectedCents, currency)}
          sublabel={`${revenue?.projected?.subscription_count || 0} renewals due`}
          color="indigo"
        />
        <StatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={activeSubs}
          sublabel={`${totalSubs} total`}
          color="cyan"
        />
        <StatCard
          icon={BarChart3}
          label="Avg Revenue / Sub"
          value={activeSubs > 0 ? formatCents(avgRevPerSub, currency) : '—'}
          sublabel={activeSubs > 0 ? 'per active subscriber' : 'No active subs'}
          color="orange"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Revenue by Type</CardTitle>
            <CardDescription className="text-xs">Breakdown of succeeded payments</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {summaryGroups.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">No revenue data yet</p>
            ) : (
              <div className="space-y-4">
                {summaryGroups.map((group, i) => {
                  const pct = Math.round((group.total_cents / maxGroupCents) * 100)
                  const colors = PLAN_COLORS[i % PLAN_COLORS.length]
                  return (
                    <div key={`${group.type}-${group.currency}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${colors.bg}`} />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {typeLabels[group.type] || group.type}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{group.currency?.toUpperCase()}</Badge>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatCents(group.total_cents, group.currency)}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">{group.count} txn{group.count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors.bg} transition-all duration-700 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {/* Total row */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCents(totalRevenueCents, currency)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Subscription Distribution</CardTitle>
            <CardDescription className="text-xs">{totalSubs} subscriptions across plans</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {subscriptions.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">No subscriptions yet</p>
            ) : (
              <div className="space-y-5">
                {/* Status breakdown */}
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">By Status</p>
                  <div className="flex items-center gap-1 h-5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {statusEntries.map(([st, count]) => {
                      const pct = Math.max(2, (count / totalSubs) * 100)
                      const col = STATUS_COLORS[st] || STATUS_COLORS.active
                      return (
                        <div
                          key={st}
                          className={`h-full ${col.bg} first:rounded-l-full last:rounded-r-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                          title={`${st}: ${count}`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {statusEntries.map(([st, count]) => {
                      const col = STATUS_COLORS[st] || STATUS_COLORS.active
                      return (
                        <div key={st} className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${col.bg}`} />
                          <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{st.replace('_', ' ')}</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Plan breakdown */}
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">By Plan</p>
                  <div className="space-y-2.5">
                    {planEntries.map(([name, count], i) => {
                      const pct = Math.round((count / maxPlanCount) * 100)
                      const colors = PLAN_COLORS[i % PLAN_COLORS.length]
                      const plan = plans.find(p => p.name === name)
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 rounded-full ${colors.bg}`} />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{name}</span>
                              {plan && (
                                <span className="text-[10px] text-slate-400">
                                  {plan.monthly_minutes === null ? '∞' : plan.monthly_minutes.toLocaleString()} min
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colors.bg} transition-all duration-700 ease-out`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent payments mini-table */}
      {payments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Payments</CardTitle>
            <CardDescription className="text-xs">Last {payments.length} transactions</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      p.status === 'succeeded'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {p.status === 'succeeded'
                        ? <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        : <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {p.description || (p.type === 'subscription' ? 'Subscription payment' : 'Top-up purchase')}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {p.user_id?.substring(0, 12)}… · {p.created_at ? formatDate(p.created_at) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-semibold ${
                      p.status === 'succeeded' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {p.status === 'succeeded' ? '+' : ''}{formatCents(p.amount_cents, p.currency)}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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

      {/* Platform Stats Grid */}
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

      {/* Revenue & Subscriptions Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-slate-400" />
          Revenue & Subscriptions
        </h2>
        <RevenueOverview token={session.token} />
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
