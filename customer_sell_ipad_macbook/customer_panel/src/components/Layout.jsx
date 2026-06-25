import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  Home, ShoppingBag, Store, ClipboardList, User,
  LogOut, Bell, ChevronDown, Settings, X, HelpCircle
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home', end: true },
  { path: '/dashboard/shop', icon: Store, label: 'Shop' },
  { path: '/dashboard/sell', icon: ShoppingBag, label: 'Sell', isCta: true },
  { path: '/dashboard/requests', icon: ClipboardList, label: 'Orders' },
  { path: '/dashboard/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const { user, userProfile, logout } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayName = userProfile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (path, end) => {
    if (end) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Top Header ─── */}
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-6xl mx-auto px-3 lg:px-6">
          <div className="flex items-center h-12 lg:h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 mr-6 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-cta)' }}>
                <span className="text-white font-black text-xs">BE</span>
              </div>
              <span className="font-extrabold text-sm text-gradient hidden sm:block">BuyBack Elite</span>
            </Link>

            {/* Desktop Nav — Cloud Pill */}
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                {navItems.filter(i => !i.isCta).map((item) => {
                  const active = isActive(item.path, item.end)
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200"
                      style={active ? {
                        background: 'var(--color-primary-glow)',
                        color: 'var(--color-primary)',
                        boxShadow: '0 1px 3px rgba(6,182,212,0.15)'
                      } : {
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </nav>

            <div className="flex-1" />

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Sell CTA (desktop) */}
              <button
                onClick={() => navigate('/dashboard/sell')}
                className="hidden lg:flex items-center gap-2 btn-primary px-4 py-2 text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Sell Device
              </button>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <button
                onClick={() => navigate('/dashboard/notifications')}
                className="relative p-2 rounded-xl hover:bg-black/5 transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" style={{ color: 'var(--color-text-muted)' }} />
              </button>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--gradient-cta)' }}
                  >
                    <span className="text-white font-bold text-xs">{displayName[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--color-text-secondary)' }}>{displayName}</span>
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: 'var(--color-text-muted)' }} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl py-1.5 z-50 animate-scale-in" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{displayName}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
                    </div>
                    <NavLink
                      to="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </NavLink>
                    <NavLink
                      to="/dashboard/support"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help & Support
                    </NavLink>
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout() }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Page Content ─── */}
      <main className="p-3 lg:p-6 max-w-6xl mx-auto pb-nav lg:pb-6">
        <Outlet />
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="bottom-nav lg:hidden">
        <div className="bottom-nav-inner">
          {navItems.map((item) => {
            const active = isActive(item.path, item.end)

            if (item.isCta) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`bottom-nav-sell ${active ? 'active' : ''}`}
                >
                  <div className="sell-icon">
                    <item.icon />
                  </div>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={`bottom-nav-item ${active ? 'active' : ''}`}
              >
                <div className="nav-icon">
                  <item.icon />
                </div>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
