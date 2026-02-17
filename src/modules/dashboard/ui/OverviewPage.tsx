import { Link } from 'react-router-dom'

export function OverviewPage() {
  return (
    <main className="dashboard">
      <section className="panel">
        <p className="eyebrow">Dashboard</p>
        <h1>Welcome back</h1>
        <p className="subtitle">Create and send insulation proposals quickly for your residential clients.</p>
        <Link className="primary-link" to="/proposals/new">
          Create New Proposal
        </Link>
      </section>
    </main>
  )
}