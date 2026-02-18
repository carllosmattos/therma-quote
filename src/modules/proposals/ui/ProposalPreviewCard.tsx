import type { Proposal } from '../domain/proposal'
import type { Client } from '../../clients/domain/client'
import type { Company } from '../../company/domain/company'
import type { ProposalStatus } from '../domain/proposal'
import { getServiceAreaLabel } from '../domain/insulationCatalog'

interface ProposalPreviewCardProps {
  company: Company
  client: Client | undefined
  proposal: Proposal
  nextStatus: ProposalStatus | null
  onAdvanceStatus: () => void
  onAccept?: () => void
  onReject?: () => void
  onComplete?: () => void
  onCancel?: () => void
  isSending: boolean
  successMessage: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}



export function ProposalPreviewCard(props: ProposalPreviewCardProps) {
  const hasLineItems = props.proposal.lineItems.length > 0
  const compliance = props.proposal.complianceSummary
  const credentials = props.company.credentials
  const liabilityPolicy = credentials?.insurancePolicies.find((policy) => policy.policyType === 'general-liability')
  const workersCompPolicy = credentials?.insurancePolicies.find((policy) => policy.policyType === 'workers-comp')

  return (
    <section className="panel preview-panel">
      <div className="panel-header">
        <h2>Proposal</h2>
        <span className="status-pill secondary">{props.proposal.status}</span>
      </div>

      {/* Header: Customer & Project Info */}
      <div className="preview-meta">
        <p>
          <strong>{props.company.name}</strong>
        </p>
        <p>
          <strong>Customer:</strong> {props.client?.name || 'No client selected'}
        </p>
        {props.client ? (
          <p>
            <strong>Location:</strong> {props.client.city}, {props.client.state}
          </p>
        ) : null}
      </div>

      {!hasLineItems ? (
        <div className="preview-line-item">
          <p className="subtitle">Add a service area to generate the scope of work.</p>
        </div>
      ) : (
        <>
          {/* Service Line Items (Client-Friendly View) */}
          {props.proposal.lineItems.map((lineItem) => (
            <div className="preview-line-item" key={lineItem.id}>
              <div className="preview-row total">
                <span className="service-area-header">{getServiceAreaLabel(lineItem.serviceArea)}</span>
                <span className="price-header">{formatCurrency(lineItem.finalTotal)}</span>
              </div>

              <div className="preview-row">
                <span>What's Included</span>
                <span>
                  <ul style={{ marginTop: '0.5rem', marginBottom: '0.5rem', paddingLeft: '1.5rem' }}>
                    <li>Preparation and removal of existing debris</li>
                    <li>Air sealing of all penetrations</li>
                    <li>Installation of {lineItem.materialName}</li>
                    {lineItem.additionalScopes.some((s) => s.key === 'baffle-installation') ? (
                      <li>Installation of baffles for proper ventilation</li>
                    ) : null}
                    <li>Site cleanup and final inspection</li>
                  </ul>
                </span>
              </div>

              <div className="preview-row">
                <span>Expected Results</span>
                <span>
                  After installation, this area will reach R-{lineItem.targetRValue} thermal resistance, improving
                  energy efficiency and reducing heating/cooling costs year-round.
                </span>
              </div>

              {lineItem.note ? (
                <div className="preview-row" style={{ fontStyle: 'italic', background: '#f8fafc' }}>
                  <span>Special Notes</span>
                  <span>{lineItem.note}</span>
                </div>
              ) : null}

              <hr />
            </div>
          ))}

          {/* Credentials & Compliance Summary */}
          {credentials || compliance ? (
            <div className="preview-section credentials">
              <h3>About Us</h3>
              {credentials ? (
                <>
                  {credentials.licenseNumber ? (
                    <p>
                      <strong>License:</strong> {credentials.licenseState} {credentials.licenseNumber} · {credentials.licenseType}
                    </p>
                  ) : null}
                  {liabilityPolicy ? (
                    <p>
                      <strong>Insurance:</strong> General Liability coverage · ${liabilityPolicy.coverageAmount}
                    </p>
                  ) : null}
                  {workersCompPolicy ? (
                    <p>
                      <strong>Workers' Comp:</strong> Coverage included
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}

          {/* Total Investment */}
          <div className="preview-investment-section">
            <h3>Investment</h3>

            <div className="preview-row">
              <span>Subtotal</span>
              <span>{formatCurrency(props.proposal.subtotal)}</span>
            </div>

            <div className="preview-row highlight">
              <span>
                <strong>Estimated Federal Tax Credit</strong> <br /> <small>(30% of eligible work, up to $1,200)</small>
              </span>
              <span>{formatCurrency(props.proposal.taxCredit)}</span>
            </div>

            <div className="preview-row total">
              <span>
                <strong>Your Net Investment</strong> <br /> <small>(After tax credit)</small>
              </span>
              <span className="final-price">{formatCurrency(props.proposal.netPrice)}</span>
            </div>
          </div>

          {props.proposal.note ? (
            <p className="notes-preview" style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
              <strong>Project Notes:</strong> {props.proposal.note}
            </p>
          ) : null}
        </>
      )}

      {props.successMessage ? <p className="feedback success">{props.successMessage}</p> : null}

      {/* Call-to-Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        {props.proposal.status === 'draft' && (
          <button className="primary-action" type="button" onClick={props.onAdvanceStatus} disabled={props.isSending}>
            {props.isSending ? 'Sending...' : 'Send Proposal'}
          </button>
        )}

        {props.proposal.status === 'sent' && (
          <>
            <button className="primary-action" type="button" onClick={props.onAccept} disabled={props.isSending}>
              {props.isSending ? 'Processing...' : '✓ Accept Proposal'}
            </button>
            <button className="secondary-action" type="button" onClick={props.onReject} disabled={props.isSending}>
              ✕ Decline
            </button>
          </>
        )}

        {props.proposal.status === 'accepted' && (
          <>
            <button className="primary-action" type="button" onClick={props.onComplete}>
              Mark as Completed
            </button>
            <button className="secondary-action" type="button" onClick={props.onCancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </section>
  )
}
