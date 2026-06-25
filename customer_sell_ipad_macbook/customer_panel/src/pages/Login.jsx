import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, Truck, Sparkles } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { login, loginWithGoogle, resetPassword, isLoading, error } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (forgotMode) {
      const success = await resetPassword(email)
      if (success) setResetSent(true)
      return
    }
    const success = await login(email, password)
    if (success) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Left side - Premium Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2, #164E63)' }} />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -left-20 w-80 h-80 rounded-full blur-3xl animate-blob" style={{ background: 'rgba(6,182,212,0.2)' }} />
        <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl animate-blob" style={{ background: 'rgba(139,92,246,0.15)', animationDelay: '3s' }} />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <Link to="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span className="text-white font-black text-sm">BE</span>
            </div>
            <span className="text-xl font-extrabold text-white">BuyBack Elite</span>
          </Link>
          
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4 animate-fade-in-up">
            Buy & Sell Apple<br />Devices Near You
          </h2>
          <p className="text-white/50 text-base mb-10 leading-relaxed max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            India's trusted marketplace for pre-owned MacBook & iPad. Find verified stores in your area.
          </p>
          
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {[
              { icon: Zap, label: 'Get instant price quote' },
              { icon: Truck, label: 'Free doorstep pickup' },
              { icon: Shield, label: 'Same-day secure payment' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <item.icon className="w-4 h-4 text-white/80" />
                </div>
                <span className="text-white/80 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-cta)' }}>
              <span className="text-white font-black text-xs">BE</span>
            </div>
            <span className="text-xl font-extrabold text-gradient">BuyBack Elite</span>
          </Link>

          <div className="card p-7 sm:p-8 animate-scale-in">
            <h2 className="text-xl font-extrabold text-white mb-1">
              {forgotMode ? 'Reset Password' : 'Welcome Back'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {forgotMode
                ? 'Enter your email to receive a reset link'
                : 'Sign in to your marketplace account'}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            {resetSent && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }}>
                Password reset link sent! Check your email.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10 pr-4"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {!forgotMode && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10 pr-12"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setForgotMode(!forgotMode); setResetSent(false) }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  {forgotMode ? 'Back to login' : 'Forgot password?'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 px-4 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {forgotMode ? 'Send Reset Link' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* DEV-only: Skip button for local testing. Hidden in production. */}
              {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => { sessionStorage.setItem('skipAuth', 'true'); navigate('/dashboard') }}
                className="w-full py-2.5 text-xs font-bold rounded-xl transition-all duration-200 border-2 border-dashed flex items-center justify-center gap-2"
                style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4', borderColor: '#06B6D4' }}
              >
                ⚡ Skip Login (Testing Bypass)
              </button>
              )}
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: '1px solid var(--color-border)' }} />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 text-gray-600" style={{ background: 'var(--color-surface)' }}>or continue with</span>
                </div>
              </div>

              <button
                onClick={loginWithGoogle}
                className="mt-4 w-full btn-secondary py-3 px-4 text-sm flex items-center justify-center gap-3"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>

            <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
