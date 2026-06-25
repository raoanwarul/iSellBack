import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  LayoutDashboard, Package, History, User,
  LogOut, Truck,
} from 'lucide-react'


const navItems = [
  { path: '/field-tech', icon: LayoutDashboard, label: 'Home', end: true },
  { path: '/field-tech/pickups', icon: Package, label: 'Pickups', isCta: true },
  { path: '/field-tech/history', icon: History, label: 'History' },
  { path: '/field-tech/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const { agent, logout } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayName = agent?.name || agent?.email?.split('@')[0] || 'Agent'

  const isActive = (path, end) => {
    if (end) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ag-bg)' }}>
      {/* ─── Unified Header ─── */}
      <header className="sticky top-0 z-30 h-12 lg:h-14 border-b"
        style={{ background: 'rgba(255,251,245,0.92)', backdropFilter: 'blur(16px)', borderColor: 'var(--ag-border-light)' }}>
        <div className="max-w-7xl mx-auto px-3 lg:px-4 w-full flex items-center h-full justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--ag-gradient)' }}>
              <Truck className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm ag-text-gradient leading-tight">Field Agent</p>
              <p className="text-[11px] text-stone-400 font-medium">Agent Panel</p>
            </div>
          </div>

          {/* Center: Desktop Cloud Pill Nav */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-2xl" style={{ background: 'var(--ag-surface)', border: '1px solid var(--ag-border-light)' }}>
              {navItems.map((item) => {
                const active = isActive(item.path, item.end)
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200"
                    style={active ? {
                      background: 'var(--ag-primary-glow)',
                      color: 'var(--ag-primary)',
                    } : {
                      color: 'var(--ag-text-secondary)',
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          </nav>

          {/* Right: User profile / logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline-block">Hi, <strong className="text-stone-800">{displayName}</strong></span>
            
            {/* Quick Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-red-100"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>



      {/* Page content */}
      <main className="p-3 lg:p-4 pb-nav flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="ag-bottom-nav lg:hidden">
        <div className="ag-bottom-nav-inner">
          {navItems.map((item) => {
            const active = isActive(item.path, item.end)

            if (item.isCta) {
              return (
                <NavLink key={item.path} to={item.path}
                  className={`ag-nav-cta ${active ? 'active' : ''}`}>
                  <div className="cta-icon"><item.icon /></div>
                  <span className="label">{item.label}</span>
                </NavLink>
              )
            }

            return (
              <NavLink key={item.path} to={item.path} end={item.end}
                className={`ag-nav-item ${active ? 'active' : ''}`}>
                <div className="icon"><item.icon /></div>
                <span className="label">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
