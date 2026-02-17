import type { Proposal } from '../domain/proposal'

const PROPOSALS_KEY = 'thermaquote_proposals'

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function listAll(): Proposal[] {
  return parseJson<Proposal[]>(localStorage.getItem(PROPOSALS_KEY), [])
}

function saveAll(proposals: Proposal[]): void {
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals))
}

export function listContractorProposals(contractorId: string): Proposal[] {
  return listAll().filter((proposal) => proposal.contractorId === contractorId && !proposal.deletedAt)
}

export function getProposal(proposalId: string): Proposal | null {
  return listAll().find((proposal) => proposal.id === proposalId && !proposal.deletedAt) ?? null
}

export function deleteProposal(proposalId: string): void {
  const proposals = listAll()
  const index = proposals.findIndex((item) => item.id === proposalId)

  if (index >= 0) {
    proposals[index] = { ...proposals[index], deletedAt: new Date().toISOString() }
    saveAll(proposals)
  }
}

export function upsertProposal(nextProposal: Proposal): void {
  const proposals = listAll()
  const index = proposals.findIndex((item) => item.id === nextProposal.id)

  if (index >= 0) {
    proposals[index] = { ...nextProposal, updatedAt: new Date().toISOString() }
    saveAll(proposals)
    return
  }

  proposals.push(nextProposal)
  saveAll(proposals)
}
