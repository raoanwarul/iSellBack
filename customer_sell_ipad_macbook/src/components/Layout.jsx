import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  LayoutDashboard, 
  Package, 
  History,
  User,
  LogOut,
  Menu,
  X,
  Truck,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Home' },
  { path: '/pickups', icon: Package, label: 'My Pickups', mobileLabel: 'Pickups' },
  { path: '/history', icon: History, label: 'History', mobileLabel: 'History' },
  { path: '/profile', icon: User, label: 'Profile', mobileLabel: 'Profile' },
]

export default function Layout() {
  const { agent, assignedPickups, logout } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayName = agent?.name || agent?.email?.split('@')[0] || 'Agent'
  const activePickupCount = assignedPickups?.length || 0

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Slide-in Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-[260px] bg-white shadow-2xl shadow-gray-300/30
        transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-agent flex items-center justify-center shadow-md shadow-orange-500/20">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold text-gradient">Agent Portal</span>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <nav className="p-2.5 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm
                ${isActive ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}
              `}
              onClick={() => setSidebarOpen(false)}>
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-2.5 px-1">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
              <span className="text-orange-700 font-bold text-sm">{displayName[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{displayName}</p>
              <p className="text-[11px] text-gray-400 truncate">{agent?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="pb-16 lg:pb-0">
        {/* Desktop Header with inline tabs */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/60">
          <div className="max-w-5xl mx-auto px-4 lg:px-6">
            <div className="flex items-center h-16">
              {/* Mobile hamburger */}
              <button className="p-2 hover:bg-gray-100/80 rounded-xl mr-3 transition-colors lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-gray-500" />
              </button>

              {/* Logo */}
              <div className="flex items-center gap-2 mr-8">
                <div className="w-8 h-8 rounded-xl gradient-agent flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-sm text-gradient hidden sm:block">Agent Portal</span>
              </div>

              {/* Desktop Tab Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)
                  return (
                    <NavLink key={item.path} to={item.path} end={item.path === '/'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                        isActive
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      {item.path === '/pickups' && activePickupCount > 0 && (
                        <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[9px] font-bold bg-orange-500 text-white">
                          {activePickupCount}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>

              <div className="flex-1" />

              {/* Right side */}
              <div className="flex items-center gap-2">
                <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Bell className="w-[18px] h-[18px] text-gray-400" />
                  {activePickupCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white" />
                  )}
                </button>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-700 font-bold text-xs">{displayName[0]?.toUpperCase() || 'A'}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">{displayName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-xl shadow-gray-200/50 py-1.5 z-50 animate-scale-in">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="font-semibold text-sm text-gray-900">{displayName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{agent?.email}</p>
                      </div>
                      <NavLink to="/profile" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4" /> My Profile
                      </NavLink>
                      <button onClick={() => { setProfileOpen(false); handleLogout() }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 lg:p-6 max-w-5xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-100 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-[56px] px-2">
          {navItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            return (
              <NavLink key={item.path} to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative">
                {isActive && <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full" />}
                <div className="relative">
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                  {item.path === '/pickups' && activePickupCount > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] flex items-center justify-center px-0.5 rounded-full text-[8px] font-bold bg-orange-500 text-white">
                      {activePickupCount}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] leading-tight transition-colors ${isActive ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                  {item.mobileLabel}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
