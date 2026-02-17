import { company } from '../../../data/seedData'
import { useProposalBuilder } from '../../proposals/application/useProposalBuilder'
import { ProposalBuilderCard } from '../../proposals/ui/ProposalBuilderCard'
import { ProposalPreviewCard } from '../../proposals/ui/ProposalPreviewCard'
import { useAuth } from '../../auth/application/useAuth'
import { ThermaQuoteLogo } from '../../shared/ui/ThermaQuoteLogo'
import { useContractorClients } from '../../clients/application/useContractorClients'
import { Link, useParams } from 'react-router-dom'

export function DashboardPage() {
  const { user } = useAuth()
  const { id: proposalId } = useParams<{ id?: string }>()

  const { clients } = useContractorClients(user?.id ?? 'no-contractor')

  const { state, actions } = useProposalBuilder({
    contractorId: user?.id ?? 'no-contractor',
    company,
    clients,
    proposalId,
  })

  if (!user) {
    return null
  }

  if (clients.length === 0) {
    return (
      <main className="dashboard">
        <header className="topbar panel">
          <div>
            <ThermaQuoteLogo />
            <h1>Insulation Proposal Workspace</h1>
            <p className="subtitle">Build accurate residential insulation proposals in minutes.</p>
          </div>
          <div className="meta-list">
            <span>Contractor: {user.name}</span>
            <span>Company: {user.companyName}</span>
            <span>Status flow: draft → sent</span>
          </div>
        </header>

        <section className="panel">
          <h2 style={{ marginTop: 0 }}>Add your first client to start quoting</h2>
          <p className="subtitle">Create at least one client profile before building a technical insulation proposal.</p>
          <Link className="primary-link" to="/clients">
            Go to Clients
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard">
      <header className="topbar panel">
        <div>
          <ThermaQuoteLogo />
          <h1>Insulation Proposal Workspace</h1>
          <p className="subtitle">Build accurate residential insulation proposals in minutes.</p>
        </div>
        <div className="meta-list">
          <span>Contractor: {user.name}</span>
          <span>Company: {user.companyName}</span>
          <span>Status flow: draft → sent</span>
        </div>
      </header>

      <section className="grid">
        <ProposalBuilderCard
          status={state.proposal.status}
          isReadOnly={state.isReadOnly}
          actionMessage={state.actionMessage}
          clientQuery={state.clientQuery}
          filteredClients={state.filteredClients}
          areaQuery={state.areaQuery}
          filteredServiceAreas={state.filteredServiceAreas}
          scopeQuery={state.scopeQuery}
          filteredScopes={state.filteredScopes}
          climateZone={state.climateZone}
          serviceAreas={state.serviceAreas}
          materials={state.materials}
          applications={state.applications}
          lineItems={state.lineItems}
          activeLineItemId={state.activeLineItemId}
          activeLineItem={state.activeLineItem}
          bagCountWarning={state.bagCountWarning}
          depthWarning={state.depthWarning}
          scopeConflictWarning={state.scopeConflictWarning}
          note={state.note}
          onClientQueryChange={actions.setClientQuery}
          onSelectClient={actions.selectClient}
          onAreaQueryChange={actions.setAreaQuery}
          onScopeQueryChange={actions.setScopeQuery}
          onClimateZoneChange={actions.setClimateZone}
          onAddServiceLine={actions.addServiceLine}
          onSelectActiveLine={actions.selectActiveLine}
          onRemoveServiceLine={actions.removeServiceLine}
          onMaterialChange={actions.setMaterial}
          onApplicationChange={actions.setApplication}
          onRValuePerInchChange={actions.setRValuePerInch}
          onAreaChange={actions.setAreaSqFt}
          onWasteFactorChange={actions.setWasteFactorPct}
          onCoverageFactorChange={actions.setCoverageFactor}
          onMobilizationCostChange={actions.setMobilizationCost}
          onMaterialCostChange={actions.setMaterialCostPerSqFt}
          onLaborCostChange={actions.setLaborCostPerSqFt}
          onMarginChange={actions.setMarginRate}
          onTargetRValueChange={actions.setTargetRValue}
          onExistingRValueChange={actions.setExistingRValue}
          onAddScope={actions.addScope}
          onScopeQuantityChange={(scopeKey, value) => actions.updateScope(scopeKey, 'quantity', value)}
          onScopeUnitPriceChange={(scopeKey, value) => actions.updateScope(scopeKey, 'unitPrice', value)}
          onRemoveScope={actions.removeScope}
          onSubtotalChange={actions.setSubtotal}
          onSuggestedTotalChange={actions.setSuggestedTotal}
          onFinalTotalChange={actions.setFinalTotal}
          onUseFormula={actions.useFormula}
          onUseSuggestion={actions.useSuggestion}
          onMatchSuggested={actions.matchSuggested}
          onLineNoteChange={actions.setLineNote}
          onNoteChange={actions.setNote}
        />

        <ProposalPreviewCard
          company={company}
          client={state.selectedClient}
          proposal={state.proposal}
          nextStatus={state.nextProposalStatus}
          onAdvanceStatus={actions.moveToSent}
          onAccept={actions.acceptProposal}
          onReject={actions.rejectProposal}
          onComplete={actions.completeProposal}
          onCancel={actions.cancelProposal}
          isSending={state.isSending}
          successMessage={state.successMessage}
        />
      </section>
    </main>
  )
}
