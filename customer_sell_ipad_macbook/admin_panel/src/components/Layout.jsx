import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  LayoutDashboard, ClipboardList, Package, Users, Settings,
  LogOut, Bell, ChevronDown, Store,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/requests', icon: ClipboardList, label: 'Orders' },
  { path: '/listings', icon: Package, label: 'Listings', isCta: true },
  { path: '/agents', icon: Users, label: 'Agents' },
  { path: '/price-engine', icon: Settings, label: 'Pricing' },
]

const desktopNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/requests', icon: ClipboardList, label: 'Sell Requests' },
  { path: '/listings', icon: Package, label: 'Listings' },
  { path: '/agents', icon: Users, label: 'Agents' },
  { path: '/price-engine', icon: Settings, label: 'Price Engine' },
  { path: '/condition-deductions', icon: Settings, label: 'Deductions' },
  { path: '/settings', icon: Settings, label: 'Store Settings' },
]

export default function Layout() {
  const { user, adminProfile, logout } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayName = adminProfile?.name || user?.email?.split('@')[0] || 'Admin'
  const storeName = 'BuyBack Elite'

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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bo-bg)' }}>
      {/* ─── Unified Header ─── */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderColor: 'var(--bo-border)' }}>
        <div className="max-w-7xl mx-auto px-3 lg:px-6">
          <div className="flex items-center h-12 lg:h-14 justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--bo-gradient)' }}>
                <Store className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-sm bo-text-gradient leading-tight">{storeName}</p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--bo-text-muted)' }}>Store Panel</p>
              </div>
            </div>

            {/* Center: Desktop Cloud Pill Nav */}
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-2xl" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>
                {desktopNavItems.map((item) => {
                  const active = isActive(item.path, item.end)
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200"
                      style={active ? {
                        background: 'var(--bo-primary-glow)',
                        color: 'var(--bo-primary)',
                      } : {
                        color: 'var(--bo-text-secondary)',
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </nav>

            {/* Right: Notifications & Profile Dropdown */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 rounded-xl hover:bg-black/5 transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" style={{ color: 'var(--bo-text-secondary)' }} />
              </button>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-black/5 transition-colors"
                >
                  <div
                    className="w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: 'var(--bo-gradient)' }}
                  >
                    <span>{displayName[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-semibold hidden sm:block" style={{ color: 'var(--bo-text)' }}>{displayName}</span>
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: 'var(--bo-text-muted)' }} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl py-1.5 z-50 shadow-lg animate-scale-in" style={{ border: '1px solid var(--bo-border)' }}>
                    <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--bo-border)' }}>
                      <p className="font-semibold text-xs" style={{ color: 'var(--bo-text)' }}>{displayName}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--bo-text-muted)' }}>{user?.email}</p>
                    </div>
                    <NavLink
                      to="/notifications"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--bo-text-secondary)' }}
                    >
                      <Bell className="w-3.5 h-3.5" style={{ color: 'var(--bo-text-muted)' }} />
                      Notifications
                    </NavLink>
                    <NavLink
                      to="/condition-deductions"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--bo-text-secondary)' }}
                    >
                      <Settings className="w-3.5 h-3.5" style={{ color: 'var(--bo-text-muted)' }} />
                      Deductions
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--bo-text-secondary)' }}
                    >
                      <Settings className="w-3.5 h-3.5" style={{ color: 'var(--bo-text-muted)' }} />
                      Store Settings
                    </NavLink>
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout() }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 p-2.5 sm:p-4 lg:p-6 pb-nav lg:pb-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="bo-bottom-nav lg:hidden">
        <div className="bo-bottom-nav-inner">
          {navItems.map((item) => {
            const active = isActive(item.path, item.end)

            if (item.isCta) {
              return (
                <NavLink key={item.path} to={item.path}
                  className={`bo-nav-item ${active ? 'active' : ''}`}
                  style={{ marginTop: '-10px' }}>
                  <div className="icon" style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--bo-gradient)',
                    boxShadow: '0 3px 10px rgba(124,58,237,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <item.icon style={{ width: 18, height: 18, color: 'white' }} />
                  </div>
                  <span className="label" style={{ color: 'var(--bo-primary)', fontWeight: 600, marginTop: 2 }}>{item.label}</span>
                </NavLink>
              )
            }

            return (
              <NavLink key={item.path} to={item.path} end={item.end}
                className={`bo-nav-item ${active ? 'active' : ''}`}>
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
