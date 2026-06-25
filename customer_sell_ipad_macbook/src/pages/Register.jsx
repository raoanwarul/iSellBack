import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Truck, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, CheckCircle2, AlertCircle, MapPin } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: ''
  })
  const [emailVerified, setEmailVerified] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (e.target.name === 'email') setEmailVerified(false)
  }

  // Step 1: Verify email is pre-approved by admin in approved_agent_emails table
  const handleVerifyEmail = async () => {
    if (!formData.email?.trim()) {
      setError('Please enter your email first')
      return
    }
    setVerifyingEmail(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('approved_agent_emails')
        .select('*')
        .eq('email', formData.email.toLowerCase().trim())
        .eq('is_active', true)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      if (!data) {
        setError('This email is not approved for agent registration. Your administrator must first add your email from the Admin Panel.')
        setEmailVerified(false)
      } else {
        setEmailVerified(true)
        if (data.name && !formData.name) setFormData(prev => ({ ...prev, name: data.name }))
        if (data.phone && !formData.phone) setFormData(prev => ({ ...prev, phone: data.phone }))
        if (data.city && !formData.city) setFormData(prev => ({ ...prev, city: data.city }))
      }
    } catch (err) {
      console.error('Email verification error:', err)
      setError('Failed to verify email. Please try again.')
    }
    setVerifyingEmail(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!emailVerified) {
      setError('Please verify your email first')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setIsLoading(true)
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name, role: 'agent' }
        }
      })
      if (authError) throw authError

      // 2. Create agent record in agents table
      const { error: agentError } = await supabase
        .from('agents')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          is_active: true,
          is_available: true
        })
      if (agentError) throw agentError

      // 3. Mark email as registered
      await supabase
        .from('approved_agent_emails')
        .update({ is_registered: true, registered_at: new Date().toISOString() })
        .eq('email', formData.email.toLowerCase().trim())

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-500 mb-4">Your agent account has been created. Please check your email to verify your account.</p>
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -right-20 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">Agent Panel</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
            Join as Field<br />Agent
          </h2>
          <p className="text-white/60 text-base mb-10 leading-relaxed max-w-sm">
            Register as a pickup agent to collect devices and earn commissions.
          </p>
          <div className="space-y-3">
            {['Manage pickups', 'Navigate to customers', 'Verify devices', 'Process payments'].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-300 shrink-0" />
                <span className="text-white/80 text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-gray-50/50 relative">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="w-full max-w-[420px] relative z-10">
          <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
            <div className="w-9 h-9 rounded-xl gradient-agent flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gradient">Agent Panel</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-7">
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Agent Registration</h2>
            <p className="text-gray-400 text-sm mb-1">Create your agent account</p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">Your email must be pre-approved by the administrator before you can register.</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium border bg-red-50 border-red-100 text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Step 1: Email Verification */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email * (must be pre-approved by admin)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm ${emailVerified ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}
                      placeholder="agent@email.com" required />
                  </div>
                  <button type="button" onClick={handleVerifyEmail} disabled={verifyingEmail || emailVerified}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0 transition-all ${emailVerified ? 'bg-green-100 text-green-700' : 'bg-orange-600 text-white hover:bg-orange-700'} disabled:opacity-60`}>
                    {verifyingEmail ? '...' : emailVerified ? 'Verified' : 'Verify'}
                  </button>
                </div>
                {emailVerified && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Email verified! Fill in details below.</p>}
              </div>

              {/* Step 2: Account details (only after email verified) */}
              {emailVerified && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" name="name" value={formData.name} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all text-sm"
                        placeholder="Your full name" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all text-sm"
                          placeholder="9876543210" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">City / Area</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" name="city" value={formData.city} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all text-sm"
                          placeholder="Your city" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all text-sm"
                      placeholder="••••••" required minLength={6} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all text-sm"
                      placeholder="••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isLoading || !emailVerified}
                className="w-full py-3 mt-2 gradient-agent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Create Agent Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
