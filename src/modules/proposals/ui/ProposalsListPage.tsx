import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/application/useAuth'
import { listContractorProposals, deleteProposal } from '../infrastructure/proposalStorage'
import type { Proposal, ProposalStatus } from '../domain/proposal'

export function ProposalsListPage() {
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>(() => listContractorProposals(user?.id ?? 'no-contractor'))
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all')

  if (!user) {
    return null
  }

  const handleDelete = (proposal: Proposal) => {
    if (window.confirm(`Delete proposal #${proposal.id.slice(-8)}?`)) {
      deleteProposal(proposal.id)
      setProposals(listContractorProposals(user.id))
    }
  }

  const filteredProposals =
    statusFilter === 'all' ? proposals : proposals.filter((proposal) => proposal.status === statusFilter)

  const statusLabels: Record<ProposalStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
    completed: 'Completed',
    canceled: 'Canceled',
  }

  const statusClasses: Record<ProposalStatus, string> = {
    draft: 'status-draft',
    sent: 'status-sent',
    accepted: 'status-accepted',
    rejected: 'status-rejected',
    completed: 'status-completed',
    canceled: 'status-canceled',
  }

  return (
    <main className="dashboard">
      <section className="panel">
        <div className="panel-header">
          <h1>Proposals</h1>
          <Link className="primary-action" to="/proposals/new">
            Create New
          </Link>
        </div>
        <p className="subtitle">Manage all insulation proposals for your clients.</p>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Filter by status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProposalStatus | 'all')}>
              <option value="all">All Proposals</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="panel" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>No proposals found</h3>
            <p className="subtitle">
              {statusFilter === 'all'
                ? 'Create your first proposal to get started.'
                : `No proposals with status "${statusLabels[statusFilter as ProposalStatus]}".`}
            </p>
            <Link className="primary-action" to="/proposals/new">
              Create Proposal
            </Link>
          </div>
        ) : (
          <div className="list-grid">
            {filteredProposals.map((proposal) => (
              <article className="list-item" key={proposal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>Proposal #{proposal.id.slice(-8)}</strong>
                    <span className={`status-pill ${statusClasses[proposal.status]}`}>{statusLabels[proposal.status]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link className="secondary-action" to={`/proposals/${proposal.id}/edit`}>
                      Edit
                    </Link>
                    <button className="secondary-action" onClick={() => handleDelete(proposal)} title="Delete proposal">
                      Delete
                    </button>
                  </div>
                </div>
                <span>Client ID: {proposal.clientId}</span>
                <span>Climate Zone: {proposal.climateZone}</span>
                <span>Total: ${proposal.finalTotal.toFixed(2)}</span>
                <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                <span>
                  {proposal.lineItems.length} line {proposal.lineItems.length === 1 ? 'item' : 'items'}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
