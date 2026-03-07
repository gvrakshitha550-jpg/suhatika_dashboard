import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminGate } from './components/AdminGate'
import { isFirebaseConfigured } from './firebase'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'

function SetupRequired() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Outfit, system-ui, sans-serif',
      background: '#f8f9fa',
      color: '#212529',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ color: '#7c3aed', marginBottom: '1rem' }}>Suhatika Sarees Admin</h1>
        <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
          Firebase is not configured. Create a <code style={{ background: '#e9ecef', padding: '0.2em 0.4em', borderRadius: 4 }}>.env.local</code> file with your Firebase Web config.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#6c757d' }}>
          Copy <code>.env.example</code> to <code>.env.local</code> and fill in the values from Firebase Console → Project Settings → Your apps.
        </p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminGateWrapper({ children }) {
  const { user } = useAuth()
  return <AdminGate user={user}>{children}</AdminGate>
}

function LoginRedirect({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect><Auth /></LoginRedirect>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminGateWrapper>
              <Dashboard />
            </AdminGateWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupRequired />
  }
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
