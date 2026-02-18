import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../application/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    const result = await register({
      name,
      companyName,
      email,
      password,
    })

    if (!result.ok) {
      setErrorMessage(result.message)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    navigate('/')
  }

  return (
    <main className="auth-page">
      <form className="auth-card panel" onSubmit={onSubmit}>
        <p className="eyebrow">Contractor Onboarding</p>
        <h1>Register</h1>

        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
        </label>

        <label>
          Company name
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
            autoComplete="organization"
          />
        </label>

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
            autoComplete="new-password"
          />
        </label>

        {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

        <button className="primary-action" type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Register as Contractor'}
        </button>

        <p className="auth-link-row">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  )
}
