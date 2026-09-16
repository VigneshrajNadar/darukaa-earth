import { Outlet, NavLink } from 'react-router-dom'

/**
 * AppLayout — shell layout for authenticated app sections.
 *
 * This component provides the navigation sidebar and main content area.
 * Authentication enforcement will be added in the authentication stage.
 */
function AppLayout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-earth-600 text-white'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
    }`

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-slate-800 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800">
          <h1 className="text-lg font-semibold text-earth-400 tracking-tight">Darukaa.Earth</h1>
          <p className="text-xs text-slate-500 mt-0.5">Environmental Intelligence</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={navLinkClass}>
            Projects
          </NavLink>
          <NavLink to="/map" className={navLinkClass}>
            Map
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
