import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, RefreshCw } from 'lucide-react'
import { superAdminApi, subscriptionApi } from '@/lib/api'
import { formatDate, gameTypeDisplayName, roleDisplayName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

function formatCents(cents, currency = 'EUR') {
  const amount = Number(cents || 0) / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'EUR').toUpperCase(),
  }).format(amount)
}

export default function UserOverviewPage({ session }) {
  const { userId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [games, setGames] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [balance, setBalance] = useState(null)
  const [topupMinutes, setTopupMinutes] = useState(0)
  const [payments, setPayments] = useState([])
  const [plansById, setPlansById] = useState({})

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [userRes, gamesRes, subscriptionRes, paymentsRes, plansRes] = await Promise.all([
        superAdminApi.getUser(session.token, userId),
        superAdminApi.getUserGames(session.token, userId),
        subscriptionApi.getUserSubscription(session.token, userId),
        subscriptionApi.listPayments(session.token, { userId, limit: 250, offset: 0 }),
        subscriptionApi.listPlans(session.token),
      ])

      setUser(userRes?.user || null)
      setGames(Array.isArray(gamesRes?.games) ? gamesRes.games : [])
      setSubscription(subscriptionRes?.subscription || null)
      setBalance(subscriptionRes?.balance || null)
      setTopupMinutes(Number(subscriptionRes?.topup_minutes || 0))
      setPayments(Array.isArray(paymentsRes?.payments) ? paymentsRes.payments : [])

      const planMap = {}
      const plans = Array.isArray(plansRes?.plans) ? plansRes.plans : []
      for (const plan of plans) {
        if (plan?.id) planMap[String(plan.id)] = plan
      }
      setPlansById(planMap)
    } catch (err) {
      setError(err.message || 'Failed to load user overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [userId])

  const activePlan = useMemo(() => {
    const planId = subscription?.plan_id
    if (!planId) return null
    return plansById[String(planId)] || null
  }, [plansById, subscription])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500 dark:text-slate-400">User not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/dashboard/users"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link to={`/dashboard/users/${userId}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit user
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User overview</CardTitle>
          <CardDescription>All account and activity data currently available for this user.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Current plan, minute balance, and top-up usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Plan</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{activePlan?.name || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Status</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{subscription?.status || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Minutes remaining</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {balance?.is_unlimited ? 'Unlimited' : String(balance?.minutes_remaining ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Top-up minutes</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{topupMinutes}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Billing period: {formatDate(subscription?.current_period_start)} → {formatDate(subscription?.current_period_end)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Owned games</CardTitle>
          <CardDescription>{games.length} game(s) owned by this user.</CardDescription>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No games owned by this user.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Game</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game, index) => (
                  <TableRow key={String(game?.id || index)}>
                    <TableCell className="font-medium">{String(game?.name || '-')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{gameTypeDisplayName(String(game?.game_type || game?.type || ''))}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(game?.start_at)}</TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(game?.end_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/dashboard/games/${String(game?.id || '')}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Complete payment records for this user.</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No payment records available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Stripe refs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={String(payment.id)}>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(payment.created_at)}</TableCell>
                    <TableCell className="text-sm">{String(payment.type || '-')}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'succeeded' ? 'success' : payment.status === 'failed' ? 'destructive' : 'outline'}>
                        {String(payment.status || '-')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatCents(payment.amount_cents, payment.currency)}</TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] truncate">{String(payment.description || '-')}</TableCell>
                    <TableCell className="text-[11px] font-mono text-slate-500 dark:text-slate-400 max-w-[220px] truncate">
                      {payment.stripe_invoice_id || payment.stripe_payment_intent_id || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
