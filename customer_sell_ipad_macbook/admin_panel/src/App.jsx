import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import PageTitle from './components/PageTitle'

// ─── Lazy-loaded pages (code-split into separate chunks) ───
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Requests = lazy(() => import('./pages/Requests'))
const PriceEngine = lazy(() => import('./pages/PriceEngine'))
const ConditionDeductions = lazy(() => import('./pages/ConditionDeductions'))
const FraudAlerts = lazy(() => import('./pages/FraudAlerts'))
const AgentManagement = lazy(() => import('./pages/AgentManagement'))
const Notifications = lazy(() => import('./pages/Notifications'))
const CashifyPrices = lazy(() => import('./pages/CashifyPrices'))
const Listings = lazy(() => import('./pages/Listings'))
const StoreSettings = lazy(() => import('./pages/StoreSettings'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

// ─── Shared loading spinner for Suspense fallback ───
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bo-bg)' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkAuth().finally(() => setIsChecking(false))
  }, [checkAuth])

  // DEV-only: skip auth for local testing. Stripped in production builds.
  const skipAuth = import.meta.env.DEV && sessionStorage.getItem('skipAuth') === 'true'

  if (isChecking && !skipAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bo-bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading store panel...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated && !skipAuth) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="requests" element={<Requests />} />
            <Route path="price-engine" element={<PriceEngine />} />
            <Route path="condition-deductions" element={<ConditionDeductions />} />
            <Route path="fraud-alerts" element={<FraudAlerts />} />
            <Route path="agents" element={<AgentManagement />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="cashify-prices" element={<CashifyPrices />} />
            <Route path="listings" element={<Listings />} />
            <Route path="settings" element={<StoreSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
