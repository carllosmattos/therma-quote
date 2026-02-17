export type UserType = 'contractor'

export interface ContractorUser {
  id: string
  type: UserType
  name: string
  companyName: string
  email: string
  password: string
}

export type AuthSessionUser = Omit<ContractorUser, 'password'>
