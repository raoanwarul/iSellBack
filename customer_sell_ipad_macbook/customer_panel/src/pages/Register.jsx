import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Apple, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(null)
  const { register, loginWithGoogle, isLoading, error } = useStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    const result = await register(email, password, name)
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setTimeout(() => navigate('/login'), 3000)
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Theme toggle floating at top-right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left side - Premium Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-indigo-600 to-violet-700" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -right-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <Link to="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-white font-black text-xs">BE</span>
            </div>
            <span className="text-xl font-extrabold text-white">BuyBack Elite</span>
          </Link>
          
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4 animate-fade-in-up">
            Join the Smartest Way to Sell
          </h2>
          <p className="text-white/60 text-base mb-10 leading-relaxed max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Create your account and start getting the best prices for your Apple devices.
          </p>
          
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {['Best prices guaranteed', 'Free doorstep pickup', 'Instant secure payment', 'Verified & trusted'].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-white/80 text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative">
        <div className="absolute inset-0 gradient-mesh opacity-30 animate-pulse-glow" />
        
        <div className="w-full max-w-[400px] relative z-10">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-cta)' }}>
              <span className="text-white font-black text-xs">BE</span>
            </div>
            <span className="text-xl font-extrabold text-gradient">BuyBack Elite</span>
          </Link>

          <div className="card p-7 sm:p-8 animate-scale-in">
            <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>Create Account</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Start selling your Apple devices today</p>

            {(error || message) && (
              <div className="mb-4 p-3.5 rounded-xl text-xs font-bold border"
                style={message?.type === 'success' ? {
                  background: 'rgba(16,185,129,0.12)',
                  color: '#10B981',
                  borderColor: 'rgba(16,185,129,0.2)'
                } : {
                  background: 'rgba(239,68,68,0.12)',
                  color: '#EF4444',
                  borderColor: 'rgba(239,68,68,0.2)'
                }}>
                {message?.text || error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="input w-full pl-10 text-sm"
                    placeholder="Your full name" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input w-full pl-10 text-sm"
                    placeholder="your@email.com" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input w-full pl-10 pr-12 text-sm"
                    placeholder="Min 6 characters" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input w-full pl-10 text-sm"
                    placeholder="Re-enter password" required />
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-3.5 px-4 btn-primary text-xs flex items-center justify-center gap-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }} /></div>
                <div className="relative flex justify-center text-xs"><span className="px-3 text-xs uppercase font-bold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>or</span></div>
              </div>
              <button onClick={loginWithGoogle}
                className="mt-4 w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-xs"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </button>
            </div>

            <p className="mt-5 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-bold" style={{ color: 'var(--color-primary)' }}>Sign In</Link>
            </p>
            <p className="mt-3 text-center text-[10px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              By creating an account, you agree to our{' '}
              <Link to="/terms-of-service" className="hover:underline" style={{ color: 'var(--color-primary)' }}>Terms</Link>
              {' '}and{' '}
              <Link to="/privacy-policy" className="hover:underline" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
