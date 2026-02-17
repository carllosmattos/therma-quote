import type { Proposal } from './proposal'

export interface ProposalRepository {
  list(): Promise<Proposal[]>
  save(proposal: Proposal): Promise<void>
}
