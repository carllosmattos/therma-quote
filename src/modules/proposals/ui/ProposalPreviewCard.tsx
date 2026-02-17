import type { Proposal } from '../domain/proposal'
import type { Client } from '../../clients/domain/client'
import type { Company } from '../../company/domain/company'
import type { ProposalStatus } from '../domain/proposal'
import { getClimateZoneLabel, getServiceAreaLabel, getApplicationByKey } from '../domain/insulationCatalog'

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

  return (
    <section className="panel preview-panel">
      <div className="panel-header">
        <h2>Proposal Preview</h2>
        <span className="status-pill secondary">{props.proposal.status}</span>
      </div>

      <div className="preview-meta">
        <p>
          <strong>{props.company.name} - Insulation Proposal</strong>
        </p>
        <p>
          <strong>Customer:</strong> {props.client?.name}
        </p>
        <p>
          <strong>Location:</strong> {props.client?.city}, {props.client?.state}
        </p>
        <p>
          <strong>Zone:</strong> {getClimateZoneLabel(props.proposal.climateZone)}
        </p>
      </div>

      {!hasLineItems ? (
        <div className="preview-line-item">
          <p className="subtitle">Add a service area to generate the scope of work.</p>
        </div>
      ) : null}

      {props.proposal.lineItems.map((lineItem) => {
        const application = getApplicationByKey(lineItem.application)

        return (
          <div className="preview-line-item" key={lineItem.id}>
            <div className="preview-row total">
              <span>{getServiceAreaLabel(lineItem.serviceArea)}</span>
              <span>{formatCurrency(lineItem.finalTotal)}</span>
            </div>

            <div className="preview-row">
              <span>Scope of Work</span>
              <span>
                Preparation, air sealing, and insulation for {getServiceAreaLabel(lineItem.serviceArea)}
              </span>
            </div>
            <div className="preview-row">
              <span>Preparation</span>
              <span>
                {lineItem.additionalScopes.find((scope) => scope.key === 'baffle-installation')
                  ? `Remove existing debris and install ${
                      lineItem.additionalScopes.find((scope) => scope.key === 'baffle-installation')?.quantity ?? 0
                    } baffles`
                  : 'Remove existing debris and prep the area'}
              </span>
            </div>
            <div className="preview-row">
              <span>Air Sealing</span>
              <span>Seal all penetrations using fire-rated foam</span>
            </div>
            <div className="preview-row">
              <span>Insulation</span>
              <span>
                Install {lineItem.materialName} using {application.label}
              </span>
            </div>
            <div className="preview-row">
              <span>Target</span>
              <span>
                R-{lineItem.targetRValue} (existing R-{lineItem.existingRValue}, install R-{lineItem.rValueToInstall})
              </span>
            </div>
            <div className="preview-row">
              <span>Added Depth</span>
              <span>{lineItem.depthInches.toFixed(2)} inches</span>
            </div>
            <div className="preview-row">
              <span>Area</span>
              <span>{lineItem.areaSqFt.toLocaleString()} sq ft</span>
            </div>
            <div className="preview-row">
              <span>Material quantity</span>
              <span>
                {lineItem.materialQuantity.toFixed(2)} {lineItem.materialUnit}
              </span>
            </div>
            {lineItem.additionalScopes.length > 0
              ? lineItem.additionalScopes.map((scope) => (
                  <div className="preview-row" key={scope.key}>
                    <span>{scope.name}</span>
                    <span>{formatCurrency(scope.total)}</span>
                  </div>
                ))
              : null}
            {lineItem.note ? (
              <div className="preview-row" style={{ fontStyle: 'italic', background: '#f8fafc' }}>
                <span>Note</span>
                <span>{lineItem.note}</span>
              </div>
            ) : null}
            <hr />
          </div>
        )
      })}

      <div className="preview-row">
        <span>Investment: Subtotal</span>
        <span>{formatCurrency(props.proposal.subtotal)}</span>
      </div>
      <div className="preview-row">
        <span>Estimated Federal Tax Credit (30%, max $1,200)</span>
        <span>- {formatCurrency(props.proposal.taxCredit)}</span>
      </div>
      <div className="preview-row total">
        <span>Net Investment (after tax credit)</span>
        <span>{formatCurrency(props.proposal.netPrice)}</span>
      </div>

      {props.proposal.note ? <p className="notes-preview">{props.proposal.note}</p> : null}

      {props.successMessage ? <p className="feedback success">{props.successMessage}</p> : null}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {props.proposal.status === 'draft' && (
          <button className="primary-action" type="button" onClick={props.onAdvanceStatus} disabled={props.isSending}>
            {props.isSending ? 'Sending...' : 'Move to Sent'}
          </button>
        )}

        {props.proposal.status === 'sent' && (
          <>
            <button className="primary-action" type="button" onClick={props.onAccept} disabled={props.isSending}>
              {props.isSending ? 'Processing...' : 'Accept Proposal'}
            </button>
            <button className="secondary-action" type="button" onClick={props.onReject} disabled={props.isSending}>
              {props.isSending ? 'Processing...' : 'Reject Proposal'}
            </button>
          </>
        )}

        {props.proposal.status === 'accepted' && (
          <button className="primary-action" type="button" onClick={props.onComplete} disabled={props.isSending}>
            {props.isSending ? 'Processing...' : 'Mark as Completed'}
          </button>
        )}

        {['draft', 'sent', 'accepted'].includes(props.proposal.status) && (
          <button className="secondary-action" type="button" onClick={props.onCancel} disabled={props.isSending} style={{ marginLeft: 'auto' }}>
            {props.isSending ? 'Processing...' : 'Cancel Proposal'}
          </button>
        )}
      </div>
    </section>
  )
}
