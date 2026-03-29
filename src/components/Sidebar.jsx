import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Gamepad2, Users, LogOut, Shield, Trophy, Sun, Moon, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { cn, roleDisplayName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { hasSuperAdminRole } from '@/lib/auth'
import { getTheme, toggleTheme } from '@/lib/theme'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/games', label: 'Games', icon: Trophy },
  { to: '/dashboard/game-modes', label: 'Game Modes', icon: Gamepad2 },
  { to: '/dashboard/users', label: 'Users', icon: Users },
  { to: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
]

export default function Sidebar({ session, onLogout }) {
  const location = useLocation()
  const [theme, setTheme] = useState(() => getTheme())

  function handleToggleTheme() {
    const next = toggleTheme()
    setTheme(next)
  }

  return (
    <aside className="flex flex-col h-screen w-[260px] bg-slate-950 border-r border-slate-800 fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/25">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">JotiGames</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400">
              Control Panel
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-800" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <Separator className="bg-slate-800" />

      {/* Footer */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300 uppercase">
            {(session?.username || 'SA').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">
              {session?.username || 'super-admin'}
            </p>
            <p className="text-[10px] text-slate-500">{hasSuperAdminRole(session) ? 'Super Admin' : 'Admin'}</p>
          </div>
          <button
            type="button"
            onClick={handleToggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
