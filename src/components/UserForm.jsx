import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Save, Trash2, UserPlus, UserCog } from 'lucide-react'
import { hasSuperAdminRole } from '@/lib/auth'

export default function UserForm({
  mode,
  submitting,
  error,
  onSubmit,
  onDelete,
  allowDelete,
  initialValues,
  session,
  subscriptionOptions = [],
}) {
  const [email, setEmail] = useState(initialValues.email || '')
  const [username, setUsername] = useState(initialValues.username || '')
  const [password, setPassword] = useState('')
  const [roleUser, setRoleUser] = useState(true)
  const [roleAdmin, setRoleAdmin] = useState(Boolean(initialValues.roles?.includes('ROLE_ADMIN')))
  const [roleSuperAdmin, setRoleSuperAdmin] = useState(Boolean(initialValues.roles?.includes('ROLE_SUPER_ADMIN')))
  const [isVerified, setIsVerified] = useState(Boolean(initialValues.is_verified))
  const [subscriptionPlanId, setSubscriptionPlanId] = useState(initialValues.subscription_plan_id || '')

  const canManageRoles = hasSuperAdminRole(session)

  useEffect(() => {
    setEmail(initialValues.email || '')
    setUsername(initialValues.username || '')
    setRoleUser(true)
    setRoleAdmin(Boolean(initialValues.roles?.includes('ROLE_ADMIN')))
    setRoleSuperAdmin(Boolean(initialValues.roles?.includes('ROLE_SUPER_ADMIN')))
    setIsVerified(Boolean(initialValues.is_verified))
    setSubscriptionPlanId(initialValues.subscription_plan_id || '')
    setPassword('')
  }, [initialValues])

  function handleSubmit(event) {
    event.preventDefault()
    const roles = [
      'ROLE_USER',
      ...(roleAdmin ? ['ROLE_ADMIN'] : []),
      ...(roleSuperAdmin ? ['ROLE_SUPER_ADMIN'] : []),
    ]
    onSubmit({
      email: email.trim(),
      username: username.trim(),
      ...(password.trim() ? { password } : {}),
      roles,
      is_verified: isVerified,
      ...(mode === 'edit' ? { subscription_plan_id: subscriptionPlanId || null } : {}),
    })
  }

  const Icon = mode === 'create' ? UserPlus : UserCog

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4 text-slate-400" />
            {mode === 'create' ? 'Create user' : 'Edit user'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">
              {mode === 'create' ? 'Password' : 'Password (leave blank to keep current)'}
            </Label>
            <Input
              id="user-password"
              type="password"
              placeholder={mode === 'create' ? 'Minimum 8 characters' : 'Leave empty to keep current'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required={mode === 'create'}
            />
          </div>

          <Separator />

          {/* Roles – only visible to SUPER_ADMINs */}
          {canManageRoles && (
            <div>
              <Label className="mb-3 block text-sm font-medium">Roles</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={roleUser}
                    disabled
                    onChange={() => setRoleUser(true)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span className="text-slate-400 dark:text-slate-500">User (required)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleAdmin}
                    onChange={(e) => setRoleAdmin(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  Admin
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleSuperAdmin}
                    onChange={(e) => setRoleSuperAdmin(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  Super Admin
                </label>
              </div>
            </div>
          )}

          {/* Verification */}
          <div>
            <Label className="mb-3 block text-sm font-medium">Verification</Label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              />
              Verified
            </label>
          </div>

          {mode === 'edit' && subscriptionOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="user-subscription">Subscription</Label>
              <select
                id="user-subscription"
                value={subscriptionPlanId}
                onChange={(e) => setSubscriptionPlanId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">No active subscription</option>
                {subscriptionOptions.map((plan) => (
                  <option key={String(plan.id)} value={String(plan.id)}>
                    {String(plan.name)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
          <Button
            variant="success"
            type="submit"
            disabled={submitting}
          >
            <Save className="h-4 w-4 mr-1" />
            {submitting ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
          </Button>
          {allowDelete && (
            <Button
              variant="destructive"
              type="button"
              disabled={submitting}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete user
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
