import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../application/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    const result = await login({ email, password })

    if (!result.ok) {
      setErrorMessage(result.message)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    navigate('/proposals/new')
  }

  return (
    <main className="auth-page">
      <form className="auth-card panel" onSubmit={onSubmit}>
        <p className="eyebrow">Contractor Access</p>
        <h1>Login</h1>

        <label>
          Business email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

        <button className="primary-action" type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Login'}
        </button>

        <p className="auth-link-row">
          New contractor? <Link to="/register">Create account</Link>
        </p>
      </form>
    </main>
  )
}
