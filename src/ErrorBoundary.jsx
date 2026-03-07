import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
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
        }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Something went wrong</h2>
            <pre style={{ background: '#fff', border: '1px solid #e9ecef', padding: '1rem', borderRadius: 8, overflow: 'auto', fontSize: '0.85rem' }}>
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <p style={{ marginTop: '1rem', color: '#6c757d', fontSize: '0.9rem' }}>
              Check the browser console for details. Ensure <code>.env.local</code> has valid Firebase config.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
