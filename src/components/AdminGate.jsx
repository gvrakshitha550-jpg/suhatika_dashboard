import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase'

export function AdminGate({ user, children }) {
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    if (!user?.email && !user?.uid) return
    const adminsRef = ref(db, 'admins')
    const unsub = onValue(adminsRef, (snap) => {
      const admins = snap.val()
      if (!admins || typeof admins !== 'object') {
        setIsAdmin(false)
        return
      }
      const email = (user.email || '').toLowerCase()
      const uid = user.uid
      const allowed = Object.entries(admins).some(([key, val]) => {
        if (key === uid) return true
        if (val === true || val === 1) return key.toLowerCase() === email
        if (val && typeof val === 'object' && val.email) return val.email.toLowerCase() === email
        return false
      })
      setIsAdmin(!!allowed)
    })
    return () => unsub()
  }, [user?.email, user?.uid])

  if (isAdmin === null) {
    return (
      <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verifying access…</p>
      </div>
    )
  }

  if (!isAdmin) {
    signOut(auth)
    return (
      <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Access denied</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Only admins can access this dashboard. Your credentials are for customer accounts. You have been signed out.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Add your admin email to <code style={{ background: 'var(--surface2)', padding: '0.2em 0.4em', borderRadius: 4 }}>/admins</code> in Firebase to log in as admin.
          </p>
        </div>
      </div>
    )
  }

  return children
}
