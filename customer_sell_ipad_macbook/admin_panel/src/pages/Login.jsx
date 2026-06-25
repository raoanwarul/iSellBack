import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Store, Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { login, isLoading, error, resetPassword } = useStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(email, password)
    if (success) navigate('/')
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--bo-bg)' }}>
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'var(--bo-gradient)' }} />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(167,139,250,0.3)' }} />
        <div className="absolute bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(124,58,237,0.2)' }} />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">Store Panel</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4 animate-fade-in-up">
            BuyBack Elite<br />Business Dashboard
          </h2>
          <p className="text-white/75 text-base mb-10 leading-relaxed max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Manage your store, listings, sell requests, agents, and pricing from one place.
          </p>
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {['Manage sell requests & offers', 'List devices for sale', 'Configure pricing engine', 'Manage agents & pickups'].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'rgba(167,139,250,0.8)' }} />
                <span className="text-white/80 text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative">
        <div className="w-full max-w-[400px] relative z-10">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bo-gradient)' }}>
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold bo-text-gradient">Store Panel</span>
          </div>

          <div className="bo-card p-7 sm:p-8 animate-scale-in">
            <h2 className="text-xl font-extrabold text-gray-800 mb-1">Store Sign In</h2>
            <p className="text-gray-400 text-sm mb-6">Business owner & admin access</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-red-50 border border-red-100 text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="bo-input pl-10 pr-4"
                    placeholder="admin@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="bo-input pl-10 pr-12"
                    placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-semibold" style={{ color: 'var(--bo-primary)' }}>Forgot password?</button>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full bo-btn-primary py-3 px-4 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>

              {/* DEV-only: Skip button for local testing. Hidden in production. */}
              {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => { sessionStorage.setItem('skipAuth', 'true'); navigate('/') }}
                className="w-full py-2.5 text-xs font-bold rounded-xl transition-all duration-200 border-2 border-dashed flex items-center justify-center gap-2"
                style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', borderColor: '#7C3AED' }}
              >
                ⚡ Skip Login (Testing Bypass)
              </button>
              )}
            </form>

            <div className="mt-5 p-3 rounded-xl" style={{ background: 'var(--bo-surface-2)', border: '1px solid var(--bo-border)' }}>
              <p className="text-center text-[11px] text-gray-400 mb-2">Business owner / admin access only.</p>
              <p className="text-center text-sm">
                <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--bo-primary)' }}>Create Admin Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowForgotPassword(false)}>
          <div className="bo-card p-6 w-full max-w-md shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-gray-800 mb-2">Reset Password</h3>
            <p className="text-gray-400 text-sm mb-4">Enter your email to receive a reset link.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="bo-input mb-4"
              placeholder="admin@example.com" />
            <div className="flex gap-3">
              <button onClick={() => setShowForgotPassword(false)} className="flex-1 bo-btn-secondary py-2.5 text-sm">Cancel</button>
              <button onClick={async () => { if (email) { await resetPassword(email); setShowForgotPassword(false); alert('Reset link sent if account exists.') } }}
                className="flex-1 bo-btn-primary py-2.5 text-sm">Send Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
