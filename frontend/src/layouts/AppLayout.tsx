import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  GitCompare,
  LayoutDashboard,
  Leaf,
  LogOut,
  Map as MapIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/compare', label: 'Compare', icon: GitCompare },
]

function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const signOut = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <header className="sticky top-0 z-30 border-b border-[#dfe5d9]/90 bg-[#fbfcf8]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
          <NavLink
            to="/dashboard"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="Darukaa Earth overview"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-earth-700 text-white shadow-sm transition-transform duration-300 group-hover:rotate-12">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-[-0.06em] text-[#14351f]">
              Darukaa<span className="text-earth-600">.Earth</span>
            </span>
          </NavLink>
          <nav
            className="flex min-w-0 items-center gap-1 overflow-x-auto"
            aria-label="Main navigation"
          >
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-earth-100 text-earth-800' : 'text-[#526356] hover:bg-earth-50 hover:text-earth-800'}`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2 border-l border-[#dfe5d9] pl-4">
            <div className="hidden max-w-32 text-right md:block">
              <p className="truncate text-xs font-semibold text-[#264331]">
                {user?.name || 'Administrator'}
              </p>
              <p className="truncate text-[10px] text-[#77867a]">Nature intelligence</p>
            </div>
            <button
              onClick={signOut}
              className="rounded-md p-2 text-[#647568] transition-colors hover:bg-earth-100 hover:text-earth-800 focus:outline-none focus:ring-2 focus:ring-earth-500"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
