import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Truck, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { login, resetPassword, isLoading, error } = useStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (forgotMode) {
      const success = await resetPassword(email)
      if (success) setResetSent(true)
      return
    }
    const success = await login(email, password)
    if (success) navigate('/field-tech')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--ag-bg)' }}>
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-[45%] items-center justify-center p-12 relative overflow-hidden" style={{ background: 'var(--ag-gradient)' }}>
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(251,146,60,0.3)' }} />
        <div className="absolute bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(234,88,12,0.2)' }} />
        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">BuyBack Elite</h1>
              <p className="text-white/60 text-sm">Field Agent Portal</p>
            </div>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold mb-4 leading-tight animate-fade-in-up">
            Pickup & Delivery Agent
          </h2>
          <p className="text-white/75 text-base mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Manage your assigned pickups, navigate to customers, and update status in real-time.
          </p>
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {['View assigned pickups', 'Navigate to customer location', 'Update pickup status', 'Track your earnings'].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'rgba(251,146,60,0.8)' }} />
                <span className="text-white/80 text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--ag-gradient)' }}>
              <Truck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold ag-text-gradient">Field Agent</h1>
          </div>

          <div className="ag-card p-7 sm:p-8 animate-scale-in">
            <h2 className="text-xl font-extrabold text-stone-800 mb-1">
              {forgotMode ? 'Reset Password' : 'Agent Login'}
            </h2>
            <p className="text-stone-400 text-sm mb-6">
              {forgotMode ? 'Enter your email to receive a reset link' : 'Sign in to manage your pickups'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>
            )}
            {resetSent && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
                Password reset link sent! Check your email.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="ag-input pl-10 pr-4" placeholder="agent@email.com" required />
                </div>
              </div>

              {!forgotMode && (
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      className="ag-input pl-10 pr-12" placeholder="Enter password" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button type="button" onClick={() => { setForgotMode(!forgotMode); setResetSent(false) }}
                  className="text-xs font-semibold" style={{ color: 'var(--ag-primary)' }}>
                  {forgotMode ? 'Back to login' : 'Forgot password?'}
                </button>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full ag-btn-primary py-3 px-4 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{forgotMode ? 'Send Reset Link' : 'Sign In'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* DEV-only: Skip button for local testing. Hidden in production. */}
              {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => { sessionStorage.setItem('skipAuth', 'true'); navigate('/field-tech') }}
                className="w-full py-2.5 text-xs font-bold rounded-xl transition-all duration-200 border-2 border-dashed flex items-center justify-center gap-2"
                style={{ background: 'rgba(234,88,12,0.1)', color: '#EA580C', borderColor: '#EA580C' }}
              >
                ⚡ Skip Login (Testing Bypass)
              </button>
              )}
            </form>

            <p className="mt-6 text-center text-xs text-stone-400">
              Agent accounts are created by your store admin. Contact them for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
