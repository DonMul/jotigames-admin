import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import { superAdminApi } from './lib/api'
import { clearSession, hasAdminRole, readSession } from './lib/auth'

import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/DashboardLayout'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Verifying session…</p>
      </div>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => readSession())
  const [checking, setChecking] = useState(true)

  const isLoggedIn = useMemo(() => {
    return Boolean(session?.token) && hasAdminRole(session)
  }, [session])

  useEffect(() => {
    let cancelled = false

    async function verifySession() {
      if (!session?.token || !hasAdminRole(session)) {
        if (!cancelled) setChecking(false)
        return
      }

      try {
        await superAdminApi.listUsers(session.token)
        if (!cancelled) setChecking(false)
      } catch (error) {
        const statusCode = Number(error?.status)
        const unauthorized = statusCode === 401 || statusCode === 403
        if (unauthorized) clearSession()
        if (!cancelled) {
          if (unauthorized) setSession(null)
          setChecking(false)
        }
      }
    }

    verifySession()
    return () => { cancelled = true }
  }, [])

  function handleLogin(nextSession) {
    setSession(nextSession)
    navigate('/dashboard')
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    navigate('/login')
  }

  if (checking) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="/dashboard/*"
        element={isLoggedIn ? <DashboardLayout session={session} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
