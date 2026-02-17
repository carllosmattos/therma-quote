import type { ProposalRepository } from '../domain/proposalRepository'
import type { Proposal } from '../domain/proposal'

export class InMemoryProposalRepository implements ProposalRepository {
  private proposals: Proposal[] = []

  async list(): Promise<Proposal[]> {
    return this.proposals
  }

  async save(proposal: Proposal): Promise<void> {
    const existingIndex = this.proposals.findIndex((item) => item.id === proposal.id)

    if (existingIndex >= 0) {
      this.proposals[existingIndex] = proposal
      return
    }

    this.proposals.push(proposal)
  }
}
