import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'

export default function Register() {
  // Registration steps: 1=email, 2=otp, 3=details, 4=success
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeCity: '',
    storeState: '',
    storeAddress: '',
    storePincode: '',
    storeWhatsApp: ''
  })
  const [otpCode, setOtpCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Step 1: Check if email is approved and send OTP code
  const handleSendOTP = async () => {
    if (!formData.email?.trim()) {
      setError('Please enter your email first')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      // Check if email is in approved_admin_emails table
      const { data, error: fetchErr } = await supabase
        .from('approved_admin_emails')
        .select('*')
        .eq('email', formData.email.toLowerCase().trim())
        .eq('is_active', true)
        .maybeSingle()
      
      if (fetchErr) throw fetchErr
      if (!data) {
        setError('This email is not authorized for admin registration. Please contact the system administrator to get your email approved.')
        setIsLoading(false)
        return
      }

      // Check if already registered
      if (data.is_registered) {
        setError('This email is already registered. Please login instead.')
        setIsLoading(false)
        return
      }

      // Pre-fill name/phone if available
      if (data.name) setFormData(prev => ({ ...prev, name: data.name }))
      if (data.phone) setFormData(prev => ({ ...prev, phone: data.phone }))

      // Send OTP code using Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false // Don't create user yet, just send OTP
        }
      })

      if (otpError) throw otpError

      setSuccessMsg('Verification code sent to your email!')
      setStep(2) // Move to OTP entry step
    } catch (err) {
      console.error('Send OTP error:', err)
      setError(err.message || 'Failed to send verification code. Please try again.')
    }
    setIsLoading(false)
  }

  // Step 2: Verify OTP code
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit code from your email')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      // Verify OTP with Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otpCode,
        type: 'email'
      })

      if (verifyError) throw verifyError

      // Sign out the temporary session (we'll create proper account later)
      await supabase.auth.signOut()

      // Mark email as verified in database
      await supabase
        .from('approved_admin_emails')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('email', formData.email.toLowerCase().trim())

      setSuccessMsg('Email verified successfully!')
      setStep(3) // Move to details step
    } catch (err) {
      console.error('Verify OTP error:', err)
      setError('Invalid or expired code. Please try again.')
    }
    setIsLoading(false)
  }

  // Step 3: Create account with verified email
  const handleCreateAccount = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.name?.trim()) {
      setError('Please enter your name')
      return
    }
    if (!formData.storeName?.trim()) {
      setError('Please enter your store name')
      return
    }
    if (!formData.storeCity?.trim()) {
      setError('Please enter your store city')
      return
    }
    if (!formData.storePincode?.trim()) {
      setError('Please enter your store pincode')
      return
    }
    if (!formData.storeWhatsApp?.trim()) {
      setError('Please enter your store WhatsApp number')
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

    setIsLoading(true)
    try {
      // Double-check email is verified in database
      const { data: verifyData } = await supabase
        .from('approved_admin_emails')
        .select('is_verified')
        .eq('email', formData.email.toLowerCase().trim())
        .eq('is_active', true)
        .maybeSingle()
      
      if (!verifyData?.is_verified) {
        setError('Email not verified. Please start over.')
        setStep(1)
        setIsLoading(false)
        return
      }

      // 1. Create Business
      const storeSlug = formData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .insert({
          name: formData.storeName,
          slug: storeSlug,
          city: formData.storeCity,
          state: formData.storeState || '',
          storefront_address: formData.storeAddress || '',
          whatsapp_number: formData.storeWhatsApp,
          delivery_options: { agent_pickup: true, store_visit: true },
          status: 'active'
        })
        .select()
        .single()

      if (bizError) throw bizError

      // 2. Create auth user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name, role: 'admin' },
          emailRedirectTo: `${window.location.origin}/login`
        }
      })
      if (authError) throw authError

      // 3. Create admin record in admin_users table
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          role: 'admin',
          primary_business_id: bizData.id,
          is_active: true
        })
      if (adminError) {
        console.error('Failed to insert into admin_users:', adminError.message)
        throw adminError
      }

      // 4. Create Service Zone
      const { error: zoneError } = await supabase
        .from('business_service_zones')
        .insert({
          business_id: bizData.id,
          pincode: formData.storePincode,
          city: formData.storeCity,
          state: formData.storeState || '',
          is_active: true
        })
      if (zoneError) {
        console.error('Failed to create service zone:', zoneError)
      }

      // 5. Mark email as registered in approved_admin_emails
      await supabase
        .from('approved_admin_emails')
        .update({ is_registered: true, registered_at: new Date().toISOString() })
        .eq('email', formData.email.toLowerCase().trim())

      setStep(4) // Move to success step
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    }
    setIsLoading(false)
  }

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: { shouldCreateUser: false }
      })
      if (otpError) throw otpError
      setSuccessMsg('New code sent to your email!')
    } catch (err) {
      setError('Failed to resend code. Please try again.')
    }
    setIsLoading(false)
  }

  // Step 4: Success screen
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 mb-6">Your admin account has been created successfully. You can now login to access the admin panel.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 gradient-admin text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/20 flex items-center justify-center gap-2 transition-all"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-600 to-teal-700" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -right-20 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-green-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">Admin Panel</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
            Create Admin<br />Account
          </h2>
          <p className="text-white/60 text-base mb-10 leading-relaxed max-w-sm">
            Register as an administrator to manage the BuyBack Elite platform.
          </p>
          <div className="space-y-3">
            {['Full platform access', 'Manage requests & pricing', 'Assign agents', 'View analytics'].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-violet-300 shrink-0" />
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
            <div className="w-9 h-9 rounded-xl gradient-admin flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gradient">Admin Panel</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-7">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-violet-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <h2 className="text-xl font-extrabold text-gray-900 mb-1 text-center">
              {step === 1 && 'Enter Your Email'}
              {step === 2 && 'Verify Your Email'}
              {step === 3 && 'Complete Registration'}
            </h2>
            <p className="text-gray-400 text-sm mb-4 text-center">
              {step === 1 && 'Your email must be pre-approved by the administrator'}
              {step === 2 && 'Enter the 6-digit code sent to your email'}
              {step === 3 && 'Fill in your details to create your account'}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium border bg-red-50 border-red-100 text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium border bg-green-50 border-green-100 text-violet-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Step 1: Email Entry */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                      placeholder="your-email@example.com" 
                      required 
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleSendOTP} 
                  disabled={isLoading}
                  className="w-full py-3 gradient-admin text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Send Verification Code <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: OTP Entry */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Verification Code *</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={otpCode} 
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm text-center tracking-[0.5em] font-mono text-lg"
                      placeholder="000000" 
                      maxLength={6}
                      required 
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Code sent to: {formData.email}</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleVerifyOTP} 
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full py-3 gradient-admin text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Verify Code <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleResendOTP} 
                  disabled={isLoading}
                  className="w-full py-2.5 text-violet-600 font-semibold text-sm hover:underline disabled:opacity-50"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            )}

            {/* Step 3: Account Details */}
            {step === 3 && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl mb-2">
                  <p className="text-xs text-violet-700 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Verified email: <strong>{formData.email}</strong>
                  </p>
                </div>

                {/* Store Profile Setup */}
                <div className="space-y-3.5 pt-1">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-150 pb-1.5">Store Details</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Store Name *</label>
                    <input
                      type="text"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                      placeholder="e.g. Macintosh Plaza"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Store City *</label>
                      <input
                        type="text"
                        name="storeCity"
                        value={formData.storeCity}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                        placeholder="Noida"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pincode *</label>
                      <input
                        type="text"
                        name="storePincode"
                        value={formData.storePincode}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                        placeholder="201301"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Storefront Address</label>
                    <textarea
                      name="storeAddress"
                      value={formData.storeAddress}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm resize-none"
                      placeholder="Full storefront shop address..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">WhatsApp Number *</label>
                      <input
                        type="text"
                        name="storeWhatsApp"
                        value={formData.storeWhatsApp}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                        placeholder="+919876543210"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State</label>
                      <input
                        type="text"
                        name="storeState"
                        value={formData.storeState}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                        placeholder="UP"
                      />
                    </div>
                  </div>
                </div>

                {/* Owner details */}
                <div className="space-y-3.5 pt-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-150 pb-1.5">Owner details</h3>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Owner Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                        placeholder="Full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                          placeholder="••••••"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none transition-all text-sm"
                          placeholder="••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-4 gradient-admin text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all text-sm"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Create Admin Account & Store <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-600 font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
