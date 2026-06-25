import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './agent/store/useStore'
import Layout from './agent/components/Layout'
import PageTitle from './agent/components/PageTitle'

// ─── Lazy-loaded pages (code-split into separate chunks) ───
const Login = lazy(() => import('./agent/pages/Login'))
const ResetPassword = lazy(() => import('./agent/pages/ResetPassword'))
const Dashboard = lazy(() => import('./agent/pages/Dashboard'))
const Pickups = lazy(() => import('./agent/pages/Pickups'))
const PickupDetail = lazy(() => import('./agent/pages/PickupDetail'))
const History = lazy(() => import('./agent/pages/History'))
const Profile = lazy(() => import('./agent/pages/Profile'))

// ─── Shared loading spinner for Suspense fallback ───
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg, #0f172a)' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { agent } = useStore()
  // DEV-only: skip auth for local testing. Stripped in production builds.
  const skipAuth = import.meta.env.DEV && sessionStorage.getItem('skipAuth') === 'true'
  return (agent || skipAuth) ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/'}>
      <PageTitle />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/field-tech"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pickups" element={<Pickups />} />
            <Route path="pickups/:id" element={<PickupDetail />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
