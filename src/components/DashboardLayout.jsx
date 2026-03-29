import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import OverviewPage from '@/pages/OverviewPage'
import GamesPage from '@/pages/GamesPage'
import GameModesPage from '@/pages/GameModesPage'
import UsersPage from '@/pages/UsersPage'
import UserCreatePage from '@/pages/UserCreatePage'
import UserEditPage from '@/pages/UserEditPage'
import SubscriptionsPage from '@/pages/SubscriptionsPage'

function getPageMeta(pathname) {
  if (pathname.endsWith('/users/new')) {
    return { title: 'Create User', description: 'Add a new platform user account' }
  }
  if (/\/dashboard\/users\/.+\/edit$/.test(pathname)) {
    return { title: 'Edit User', description: 'Modify user account details' }
  }
  if (pathname.endsWith('/users')) {
    return { title: 'Users', description: 'Manage platform user accounts and permissions' }
  }
  if (pathname.endsWith('/games')) {
    return { title: 'Games', description: 'Monitor and manage all games on the platform' }
  }
  if (pathname.endsWith('/game-modes')) {
    return { title: 'Game Modes', description: 'Control global game type availability' }
  }
  if (pathname.endsWith('/subscriptions')) {
    return { title: 'Subscriptions', description: 'Manage subscription plans, revenue, and billing' }
  }
  return { title: 'Overview', description: 'Platform status and quick actions' }
}

export default function DashboardLayout({ session, onLogout }) {
  const location = useLocation()
  const { title, description } = getPageMeta(location.pathname)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar session={session} onLogout={onLogout} />

      <main className="ml-[260px]">
        {/* Page Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="px-8 py-5">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 animate-fade-in">
          <Routes>
            <Route index element={<OverviewPage session={session} />} />
            <Route path="games" element={<GamesPage session={session} />} />
            <Route path="game-modes" element={<GameModesPage session={session} />} />
            <Route path="users" element={<UsersPage session={session} />} />
            <Route path="users/new" element={<UserCreatePage session={session} />} />
            <Route path="users/:userId/edit" element={<UserEditPage session={session} />} />
            <Route path="subscriptions" element={<SubscriptionsPage session={session} />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
