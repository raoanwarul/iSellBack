import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { supabase } from './lib/supabase'
import { adminUrl, agentUrl } from './lib/panelUrls'
import Layout from './components/Layout'
import PageTitle from './components/PageTitle'

// ─── Lazy-loaded pages (code-split into separate chunks) ───
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const SellDevice = lazy(() => import('./pages/SellDevice'))
const MyRequests = lazy(() => import('./pages/MyRequests'))
const RequestDetail = lazy(() => import('./pages/RequestDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'))
const Notifications = lazy(() => import('./pages/Notifications'))
const SupportTickets = lazy(() => import('./pages/SupportTickets'))
const Stores = lazy(() => import('./pages/Stores'))

// ─── Shared loading spinner for Suspense fallback ───
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    </div>
  )
}

// Global auth listener to handle OAuth PKCE code exchange
function AuthHandler() {
  const navigate = useNavigate()
  const { checkAuth } = useStore()

  useEffect(() => {
    // Handle PKCE code in URL (from Google OAuth redirect)
    const params = new URLSearchParams(window.location.search)
    if (params.get('code')) {
      supabase.auth.exchangeCodeForSession(params.get('code')).then(({ data, error }) => {
        if (!error && data?.session) {
          checkAuth().then(() => {
            // Clean up URL and redirect to dashboard
            window.history.replaceState({}, '', window.location.pathname)
            navigate('/dashboard')
          })
        }
      })
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkAuth()
      }
      if (event === 'SIGNED_OUT') {
        useStore.getState().logout()
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, checkAuth])

  return null
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useStore()
  const [isChecking, setIsChecking] = useState(true)
  const location = useLocation()

  useEffect(() => {
    checkAuth().finally(() => setIsChecking(false))
  }, [checkAuth])

  // DEV-only: skip auth for local testing. Stripped in production builds.
  const skipAuth = import.meta.env.DEV && sessionStorage.getItem('skipAuth') === 'true'

  if (isChecking && !skipAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated && !skipAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

// Redirect component for old admin/agent URLs to proper subdomains
function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.href = to
  }, [to])
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Redirecting...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthHandler />
      <PageTitle />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/stores/:slug" element={<Shop />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          
          {/* Redirect old admin/agent URLs to proper subdomains */}
          <Route path="/infra-control/*" element={<ExternalRedirect to={adminUrl()} />} />
          <Route path="/field-tech/*" element={<ExternalRedirect to={agentUrl()} />} />
          
          {/* Protected Routes - Login required */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="stores" element={<Stores />} />
            <Route path="sell" element={<SellDevice />} />
            <Route path="requests" element={<MyRequests />} />
            <Route path="requests/:id" element={<RequestDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="support" element={<SupportTickets />} />
          </Route>
          
          {/* Legacy route redirects */}
          <Route path="/sell" element={<Navigate to="/dashboard/sell" replace />} />
          <Route path="/requests" element={<Navigate to="/dashboard/requests" replace />} />
          <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
