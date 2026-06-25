import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')

  const email = searchParams.get('email')

  useEffect(() => {
    if (!email) {
      setStatus('error')
      setMessage('Invalid verification link. No email provided.')
      return
    }

    verifyEmail()
  }, [email])

  const verifyEmail = async () => {
    try {
      // Mark email as verified in approved_admin_emails table
      const { error: updateError } = await supabase
        .from('approved_admin_emails')
        .update({ 
          is_verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('email', email.toLowerCase().trim())

      if (updateError) throw updateError

      setStatus('success')
      setMessage('Email verified successfully! You can now create your admin account.')
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate(`/register?email=${encodeURIComponent(email)}&verified=true`)
      }, 3000)

    } catch (err) {
      console.error('Verification error:', err)
      setStatus('error')
      setMessage('Failed to verify email. The link may have expired. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          {status === 'loading' && (
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'success' && (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-violet-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'loading' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h2>

        <p className="text-gray-500 mb-6">
          {status === 'loading' && 'Please wait while we verify your email address.'}
          {status === 'success' && message}
          {status === 'error' && message}
        </p>

        {status === 'success' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Redirecting to registration page...</p>
            <button
              onClick={() => navigate(`/register?email=${encodeURIComponent(email)}&verified=true`)}
              className="w-full py-3 gradient-admin text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 flex items-center justify-center gap-2"
            >
              Continue to Registration <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/register')}
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
          >
            Back to Registration
          </button>
        )}
      </div>
    </div>
  )
}
