import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
    if (success) navigate('/')
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -right-20 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-red-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">Agent Portal</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4 animate-fade-in-up">
            Pickup &<br />Delivery Agent
          </h2>
          <p className="text-white/60 text-base mb-10 leading-relaxed max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Manage pickups, navigate to customers, and update status in real-time.
          </p>
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {['View assigned pickups', 'Navigate to customer', 'Verify device condition', 'Complete delivery'].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-300 shrink-0" />
                <span className="text-white/80 text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-gray-50/50 relative">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="w-full max-w-[400px] relative z-10">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl gradient-agent flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gradient">Agent Panel</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-7 sm:p-8 animate-scale-in">
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">
              {forgotMode ? 'Reset Password' : 'Agent Login'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {forgotMode ? 'Enter your email for a reset link' : 'Sign in to manage your pickups'}
            </p>

            {error && <div className="mb-4 p-3 rounded-xl text-sm font-medium border bg-red-50 border-red-100 text-red-600">{error}</div>}
            {resetSent && <div className="mb-4 p-3 rounded-xl text-sm font-medium border bg-emerald-50 border-emerald-100 text-emerald-600">Reset link sent! Check your email.</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all text-sm"
                    placeholder="agent@email.com" required />
                </div>
              </div>
              {!forgotMode && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all text-sm"
                      placeholder="Enter password" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button type="button" onClick={() => { setForgotMode(!forgotMode); setResetSent(false) }}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
                  {forgotMode ? 'Back to login' : 'Forgot password?'}
                </button>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-3 px-4 gradient-agent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2 text-sm">
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                  <>{forgotMode ? 'Send Reset Link' : 'Sign In'} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-center text-[11px] text-gray-400 mb-2">Agent accounts are created by admin. Contact your administrator for access.</p>
              <p className="text-center text-sm">
                <Link to="/register" className="text-orange-600 font-semibold hover:underline">Create Agent Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
