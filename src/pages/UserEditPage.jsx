import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { subscriptionApi, superAdminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import UserForm from '@/components/UserForm'

export default function UserEditPage({ session }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [subscriptionPlanId, setSubscriptionPlanId] = useState('')
  const [subscriptionOptions, setSubscriptionOptions] = useState([])

  async function loadUser() {
    setLoading(true)
    setError('')
    try {
      const [userRes, subscriptionRes, plansRes] = await Promise.all([
        superAdminApi.getUser(session.token, userId),
        subscriptionApi.getUserSubscription(session.token, userId),
        subscriptionApi.listPlans(session.token),
      ])

      const resolvedUser = userRes?.user || null
      const resolvedPlanId = String(subscriptionRes?.subscription?.plan_id || '')
      const plans = Array.isArray(plansRes?.plans) ? plansRes.plans : []

      setSubscriptionPlanId(resolvedPlanId)
      setSubscriptionOptions(plans.filter((plan) => Boolean(plan?.is_active)))

      if (resolvedUser) {
        setUser({
          ...resolvedUser,
          subscription_plan_id: resolvedPlanId,
        })
      } else {
        setUser(null)
      }
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
      const { subscription_plan_id: nextPlanId, ...userPayload } = payload
      await superAdminApi.updateUser(session.token, userId, userPayload)

      const normalizedPlanId = String(nextPlanId || '')
      if (normalizedPlanId && normalizedPlanId !== String(subscriptionPlanId || '')) {
        await subscriptionApi.setUserSubscription(session.token, userId, normalizedPlanId)
      }

      navigate(`/dashboard/users/${userId}`)
    } catch (err) {
      setError(err.message || 'Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this user? This cannot be undone.')
    if (!confirmed) return
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

  return (
    <div className="max-w-2xl space-y-4">
      <Link
        to="/dashboard/users"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : !user ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-slate-500">
            User not found.
          </CardContent>
        </Card>
      ) : (
        <UserForm
          mode="edit"
          submitting={submitting}
          error={error}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
          allowDelete
          initialValues={user}
          session={session}
          subscriptionOptions={subscriptionOptions}
        />
      )}
    </div>
  )
}
