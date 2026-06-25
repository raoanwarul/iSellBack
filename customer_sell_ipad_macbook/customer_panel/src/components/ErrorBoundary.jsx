import { Component } from 'react'

/**
 * Global Error Boundary — catches unhandled React rendering errors and shows
 * a friendly fallback UI instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 React Error Boundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          padding: '24px',
        }}>
          <div style={{
            maxWidth: '420px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '40px 32px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{
              color: '#f1f5f9',
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '8px',
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px',
            }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={{
                color: '#f87171',
                fontSize: '11px',
                textAlign: 'left',
                background: 'rgba(248,113,113,0.1)',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '120px',
                marginBottom: '20px',
                border: '1px solid rgba(248,113,113,0.2)',
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
