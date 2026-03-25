import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { superAdminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import UserForm from '@/components/UserForm'

export default function UserCreatePage({ session }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(payload) {
    setSubmitting(true)
    setError('')
    try {
      await superAdminApi.createUser(session.token, payload)
      navigate('/dashboard/users')
    } catch (err) {
      setError(err.message || 'Failed to create user')
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

      <UserForm
        mode="create"
        submitting={submitting}
        error={error}
        onSubmit={handleCreate}
        onDelete={() => {}}
        allowDelete={false}
        initialValues={{ email: '', username: '', roles: ['ROLE_USER'], is_verified: false }}
        session={session}
      />
    </div>
  )
}
