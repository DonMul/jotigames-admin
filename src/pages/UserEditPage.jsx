import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { superAdminApi } from '@/lib/api'
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

  async function loadUser() {
    setLoading(true)
    setError('')
    try {
      const payload = await superAdminApi.getUser(session.token, userId)
      setUser(payload?.user || null)
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
      await superAdminApi.updateUser(session.token, userId, payload)
      navigate('/dashboard/users')
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
        />
      )}
    </div>
  )
}
