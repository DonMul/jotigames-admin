import { useEffect, useState, useCallback } from 'react'
import { subscriptionApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RefreshCw, CreditCard, TrendingUp, Users, Package, Plus, Save, Sparkles, ChevronDown, ChevronUp, Shield, Check, Pencil, X, ArrowUp, ArrowDown,
} from 'lucide-react'

function formatCents(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
}

function StatusBadge({ status }) {
  const variants = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    past_due: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    pending_cancel: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }
  const cls = variants[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{status}</span>
}

// ─── Revenue Summary Card ────────────────────────────────────────────────────

function RevenueCard({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRevenue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await subscriptionApi.revenue(token)
      setData(res)
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchRevenue() }, [fetchRevenue])

  if (loading) return <Skeleton className="h-40" />
  if (!data) return null

  const projectedCents = data.projected?.projected_monthly_cents || 0
  const projectedCurrency = data.projected?.currency || 'eur'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.total_subscriptions}</p>
              <p className="text-xs text-slate-500">Total Subscriptions</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.active_subscriptions}</p>
              <p className="text-xs text-slate-500">Active Subscriptions</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCents(projectedCents, projectedCurrency)}</p>
              <p className="text-xs text-slate-500">Projected Monthly</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {data.summary?.length || 0}
              </p>
              <p className="text-xs text-slate-500">Revenue Lines</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Default Plan Selector ───────────────────────────────────────────────────

function DefaultPlanSection({ token }) {
  const [plans, setPlans] = useState([])
  const [defaultPlan, setDefaultPlan] = useState(null)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, defaultRes] = await Promise.all([
        subscriptionApi.listPlans(token),
        subscriptionApi.getDefaultPlan(token),
      ])
      const allPlans = plansRes?.plans || []
      setPlans(allPlans.filter(p => p.is_active))
      const dp = defaultRes?.default_plan || null
      setDefaultPlan(dp)
      setSelectedPlanId(dp?.id || '')
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const planId = selectedPlanId || null
      const res = await subscriptionApi.setDefaultPlan(token, planId)
      setDefaultPlan(res?.default_plan || null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ }
    setSaving(false)
  }

  if (loading) return <Skeleton className="h-24 mb-6" />

  const hasChanged = selectedPlanId !== (defaultPlan?.id || '')

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            Default Plan for New Users
          </CardTitle>
          <CardDescription>
            New users are automatically subscribed to this plan upon registration
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <select
            value={selectedPlanId}
            onChange={e => { setSelectedPlanId(e.target.value); setSaved(false) }}
            className="flex h-9 w-64 rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">No default plan</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.price_cents === 0 ? 'Free' : formatCents(p.price_cents, p.currency)}/mo
                {p.monthly_minutes === null ? ' (Unlimited)' : ` (${p.monthly_minutes.toLocaleString()} min)`}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={handleSave} disabled={saving || !hasChanged}>
            {saved ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </Button>
        </div>
        {defaultPlan && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Current default: <span className="font-medium text-slate-700 dark:text-slate-300">{defaultPlan.name}</span>
            {' — '}
            {defaultPlan.price_cents === 0 ? 'Free' : formatCents(defaultPlan.price_cents, defaultPlan.currency) + '/mo'}
          </p>
        )}
        {!defaultPlan && !selectedPlanId && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            No default plan set. New users will not be auto-subscribed.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Plans Management ────────────────────────────────────────────────────────

function PlanEditRow({ plan, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    slug: plan.slug,
    name: plan.name,
    monthly_minutes: plan.monthly_minutes === null ? '' : String(plan.monthly_minutes),
    price_cents: String(plan.price_cents),
    currency: plan.currency,
    stripe_price_id: plan.stripe_price_id || '',
    is_active: plan.is_active,
  })

  function handleSubmit(e) {
    e.preventDefault()
    const body = {}
    if (form.slug !== plan.slug) body.slug = form.slug
    if (form.name !== plan.name) body.name = form.name
    const newMinutes = form.monthly_minutes === '' ? null : Number(form.monthly_minutes)
    if (newMinutes !== plan.monthly_minutes) body.monthly_minutes = newMinutes
    const newPrice = Number(form.price_cents) || 0
    if (newPrice !== plan.price_cents) body.price_cents = newPrice
    if (form.currency !== plan.currency) body.currency = form.currency
    if ((form.stripe_price_id || null) !== (plan.stripe_price_id || null)) body.stripe_price_id = form.stripe_price_id || null
    if (form.is_active !== plan.is_active) body.is_active = form.is_active
    if (Object.keys(body).length === 0) { onCancel(); return }
    onSave(plan.id, body)
  }

  return (
    <TableRow className="bg-blue-50/50 dark:bg-blue-900/10">
      <TableCell>
        <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="h-7 text-xs font-mono w-24" />
      </TableCell>
      <TableCell>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-7 text-xs w-28" />
      </TableCell>
      <TableCell>
        <Input type="number" value={form.monthly_minutes} onChange={e => setForm({ ...form, monthly_minutes: e.target.value })} placeholder="∞" className="h-7 text-xs w-20" />
      </TableCell>
      <TableCell>
        <Input type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} className="h-7 text-xs w-20" />
      </TableCell>
      <TableCell>
        <Input value={form.stripe_price_id} onChange={e => setForm({ ...form, stripe_price_id: e.target.value })} placeholder="—" className="h-7 text-xs w-28 font-mono" />
      </TableCell>
      <TableCell>
        <button
          type="button"
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </TableCell>
      <TableCell>{plan.is_default ? <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Default</Badge> : '—'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSubmit} disabled={saving}>
            <Save className="h-3 w-3 text-emerald-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel} disabled={saving}>
            <X className="h-3 w-3 text-slate-400" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function PlansSection({ token }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ slug: '', name: '', monthly_minutes: '', price_cents: '', currency: 'eur', sort_order: 0 })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await subscriptionApi.listPlans(token)
      setPlans(res?.plans || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  async function handleSeedPlans() {
    try {
      await subscriptionApi.seedPlans(token)
      fetchPlans()
    } catch { /* ignore */ }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await subscriptionApi.createPlan(token, {
        ...form,
        monthly_minutes: form.monthly_minutes === '' ? null : Number(form.monthly_minutes),
        price_cents: Number(form.price_cents) || 0,
        sort_order: Number(form.sort_order) || 0,
      })
      setShowCreate(false)
      setForm({ slug: '', name: '', monthly_minutes: '', price_cents: '', currency: 'eur', sort_order: 0 })
      fetchPlans()
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleUpdatePlan(planId, body) {
    setSaving(true)
    try {
      await subscriptionApi.updatePlan(token, planId, body)
      setEditingId(null)
      fetchPlans()
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleToggleActive(plan) {
    setSaving(true)
    try {
      await subscriptionApi.updatePlan(token, plan.id, { is_active: !plan.is_active })
      fetchPlans()
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleMoveUp(index) {
    if (index <= 0) return
    const ids = plans.map(p => p.id)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    try {
      const res = await subscriptionApi.reorderPlans(token, ids)
      setPlans(res?.plans || [])
    } catch { /* ignore */ }
  }

  async function handleMoveDown(index) {
    if (index >= plans.length - 1) return
    const ids = plans.map(p => p.id)
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    try {
      const res = await subscriptionApi.reorderPlans(token, ids)
      setPlans(res?.plans || [])
    } catch { /* ignore */ }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Subscription Plans</CardTitle>
          <CardDescription>Manage available subscription tiers — disabled plans remain assigned to existing customers but are hidden from purchasing</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSeedPlans}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Seed Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Plan
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchPlans} className="h-8 w-8">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreate && (
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div>
              <Label className="text-xs">Slug</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. beginner" required />
            </div>
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Beginner" required />
            </div>
            <div>
              <Label className="text-xs">Minutes/month</Label>
              <Input type="number" value={form.monthly_minutes} onChange={e => setForm({ ...form, monthly_minutes: e.target.value })} placeholder="null = unlimited" />
            </div>
            <div>
              <Label className="text-xs">Price (cents)</Label>
              <Input type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} required />
            </div>
            <div className="col-span-2 md:col-span-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" type="submit" disabled={saving}>
                <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Saving…' : 'Create Plan'}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <Skeleton className="h-32" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Minutes/mo</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stripe Price</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p, idx) => (
                editingId === p.id ? (
                  <PlanEditRow key={p.id} plan={p} onSave={handleUpdatePlan} onCancel={() => setEditingId(null)} saving={saving} />
                ) : (
                  <TableRow key={p.id} className={!p.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.monthly_minutes === null ? <Badge variant="outline">Unlimited</Badge> : p.monthly_minutes.toLocaleString()}</TableCell>
                    <TableCell>{formatCents(p.price_cents, p.currency)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-400 max-w-[120px] truncate">{p.stripe_price_id || '—'}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        disabled={saving}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${p.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        title={p.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${p.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </TableCell>
                    <TableCell>{p.is_default ? <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Default</Badge> : '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingId(p.id)} title="Edit plan">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveUp(idx)} disabled={idx === 0} title="Move up">
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveDown(idx)} disabled={idx === plans.length - 1} title="Move down">
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                    No plans yet. Click "Seed Defaults" to create standard tiers.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Top-up Packages ─────────────────────────────────────────────────────────

function TopupPackagesSection({ token }) {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', minutes: '', price_cents: '', currency: 'eur' })
  const [saving, setSaving] = useState(false)

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await subscriptionApi.listTopupPackages(token)
      setPackages(res?.packages || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await subscriptionApi.createTopupPackage(token, {
        ...form,
        minutes: Number(form.minutes) || 0,
        price_cents: Number(form.price_cents) || 0,
      })
      setShowCreate(false)
      setForm({ name: '', minutes: '', price_cents: '', currency: 'eur' })
      fetchPackages()
    } catch { /* ignore */ }
    setSaving(false)
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Top-up Packages</CardTitle>
          <CardDescription>One-off minute packages users can purchase</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Package
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchPackages} className="h-8 w-8">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreate && (
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="500 Minutes" required />
            </div>
            <div>
              <Label className="text-xs">Minutes</Label>
              <Input type="number" value={form.minutes} onChange={e => setForm({ ...form, minutes: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">Price (cents)</Label>
              <Input type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} required />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" type="submit" disabled={saving}>
                <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Saving…' : 'Create'}
              </Button>
            </div>
          </form>
        )}

        {loading ? <Skeleton className="h-24" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Minutes</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.minutes.toLocaleString()}</TableCell>
                  <TableCell>{formatCents(p.price_cents, p.currency)}</TableCell>
                  <TableCell>{p.is_active ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                </TableRow>
              ))}
              {packages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-400 py-8">No top-up packages yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Active Subscriptions Table ──────────────────────────────────────────────

function SubscriptionsTable({ token }) {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  const fetchSubs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await subscriptionApi.listSubscriptions(token)
      setSubs(res?.subscriptions || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchSubs() }, [fetchSubs])

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <CardTitle className="text-base">All Subscriptions</CardTitle>
          <CardDescription>{subs.length} total</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); fetchSubs() }} className="h-8 w-8">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {loading ? <Skeleton className="h-32" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period Start</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead>Cancel at End</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs max-w-[100px] truncate">{s.user_id}</TableCell>
                    <TableCell className="font-mono text-xs">{s.plan_id}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-xs">{s.current_period_start ? formatDate(s.current_period_start) : '—'}</TableCell>
                    <TableCell className="text-xs">{s.current_period_end ? formatDate(s.current_period_end) : '—'}</TableCell>
                    <TableCell>{s.cancel_at_period_end ? <Badge variant="outline" className="text-orange-600">Yes</Badge> : '—'}</TableCell>
                    <TableCell className="text-xs">{formatDate(s.created_at)}</TableCell>
                  </TableRow>
                ))}
                {subs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">No subscriptions yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ─── Recent Payments ─────────────────────────────────────────────────────────

function PaymentsSection({ token }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await subscriptionApi.listPayments(token, { limit: 50 })
      setPayments(res?.payments || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <CardTitle className="text-base">Recent Payments</CardTitle>
          <CardDescription>Last 50 payment records</CardDescription>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </CardHeader>
      {expanded && (
        <CardContent>
          {loading ? <Skeleton className="h-24" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stripe Payment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs max-w-[100px] truncate">{p.user_id}</TableCell>
                    <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                    <TableCell>{formatCents(p.amount_cents, p.currency)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="font-mono text-xs text-slate-400 max-w-[120px] truncate">{p.stripe_payment_intent_id || '—'}</TableCell>
                    <TableCell className="text-xs">{formatDate(p.created_at)}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-8">No payments recorded yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SubscriptionsPage({ session }) {
  const token = session?.token

  return (
    <div className="space-y-0">
      <RevenueCard token={token} />
      <DefaultPlanSection token={token} />
      <PlansSection token={token} />
      <TopupPackagesSection token={token} />
      <SubscriptionsTable token={token} />
      <PaymentsSection token={token} />
    </div>
  )
}
