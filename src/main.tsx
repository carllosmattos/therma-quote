import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './modules/auth/application/AuthContext'
import { initDatabase, resetLocalDatabase } from './modules/shared/infrastructure/sqliteDb'

function AppBootstrap() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function boot() {
      try {
        await initDatabase()
        if (isActive) {
          setReady(true)
        }
      } catch (err) {
        console.error('[AppBootstrap] Error during initialization:', err)
        if (isActive) {
          const message = err instanceof Error ? err.message : 'Failed to initialize database.'
          setError(message)
        }
      }
    }

    void boot()

    return () => {
      isActive = false
    }
  }, [])

  if (error) {
    return (
      <div className="panel" style={{ margin: '2rem auto', maxWidth: '720px' }}>
        <h1 style={{ marginTop: 0 }}>Startup error</h1>
        <p className="subtitle">Failed to initialize local data storage.</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{error}</pre>
        <button
          type="button"
          onClick={async () => {
            await resetLocalDatabase()
            window.location.reload()
          }}
        >
          Reset local data and reload
        </button>
      </div>
    )
  }

  if (!ready) {
    // Silently loading - show nothing
    return null
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
)
