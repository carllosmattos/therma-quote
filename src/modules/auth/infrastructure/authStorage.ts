import type { AuthSessionUser, ContractorUser } from '../domain/contractorUser'

const USERS_KEY = 'thermaquote_users'
const SESSION_KEY = 'thermaquote_session'

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

export function listContractorUsers(): ContractorUser[] {
  return parseJson<ContractorUser[]>(localStorage.getItem(USERS_KEY), [])
}

export function saveContractorUsers(users: ContractorUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getSessionUser(): AuthSessionUser | null {
  return parseJson<AuthSessionUser | null>(localStorage.getItem(SESSION_KEY), null)
}

export function setSessionUser(user: AuthSessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSessionUser(): void {
  localStorage.removeItem(SESSION_KEY)
}
