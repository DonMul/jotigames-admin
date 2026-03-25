import { useState } from 'react'
import { Shield } from 'lucide-react'
import { authApi } from '@/lib/api'
import { writeSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await authApi.loginUser(email.trim(), password)
      if (!result || !Array.isArray(result.roles) || (!result.roles.includes('ROLE_SUPER_ADMIN') && !result.roles.includes('ROLE_ADMIN'))) {
        throw new Error('Only Admin accounts can sign in here.')
      }

      const session = {
        token: String(result.access_token || ''),
        token_type: String(result.token_type || 'Bearer'),
        principal_type: String(result.principal_type || ''),
        principal_id: String(result.principal_id || ''),
        username: String(result.username || ''),
        access_level: String(result.access_level || ''),
        roles: result.roles,
        expires_at: String(result.expires_at || ''),
      }

      writeSession(session)
      onLogin(session)
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100 dark:from-blue-950/30 dark:via-slate-950 dark:to-slate-950 -z-10" />

      <Card className="w-full max-w-[420px] shadow-lg border-slate-200/60 dark:border-slate-800/60">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            JotiGames
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">Admin Panel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to access the control panel</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@jotigames.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
