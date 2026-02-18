import type { AuthSessionUser, ContractorUser } from '../domain/contractorUser'

export function listContractorUsers(): ContractorUser[] {
  // Use localStorage only for authentication - simpler and more reliable
  const stored = localStorage.getItem('thermaquote_users')
  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored) as ContractorUser[]
    // Ensure all users have required fields with defaults
    const users = parsed.map((user) => {
      let userType: string = 'contractor'
      if (user.type) {
        const typeStr = String(user.type).trim()
        if (typeStr && typeStr !== 'null') {
          userType = typeStr
        }
      }

      return {
        id: String(user.id || ''),
        type: userType as ContractorUser['type'],
        name: String(user.name || ''),
        companyName: String(user.companyName || ''),
        email: String(user.email || ''),
        password: String(user.password || ''),
      }
    })
    
    return users
  } catch {
    console.warn('Failed to parse localStorage users')
    return []
  }
}

export function saveContractorUsers(users: ContractorUser[]): void {
  // Ensure all users have safe values
  const safeUsers = users.map((user) => {
    let userType: string = 'contractor'
    if (user?.type) {
      const typeStr = String(user.type).trim()
      if (typeStr && typeStr !== 'null') {
        userType = typeStr
      }
    }

    const safe = {
      id: String(user?.id || `contractor-${Date.now()}`),
      type: userType,
      name: String(user?.name || 'Unknown'),
      companyName: String(user?.companyName || 'Unknown'),
      email: String(user?.email || ''),
      password: String(user?.password || ''),
    }
    
    return safe
  })

  // Validate all users before saving
  for (const user of safeUsers) {
    if (!user.id) throw new Error('User must have an id')
    if (!user.type) throw new Error(`User ${user.id} must have a type`)
    if (!user.name) user.name = 'Unknown'
  }

  // Save to localStorage only - authentication uses localStorage for simplicity and reliability
  localStorage.setItem('thermaquote_users', JSON.stringify(safeUsers))
}

export function getSessionUser(): AuthSessionUser | null {
  // Use localStorage only for authentication - simpler and more reliable
  const stored = localStorage.getItem('thermaquote_session')
  if (!stored) {
    return null
  }

  try {
    const parsed = JSON.parse(stored) as AuthSessionUser
    return {
      id: String(parsed.id || ''),
      type: (parsed.type && String(parsed.type).trim() ? String(parsed.type) : 'contractor') as AuthSessionUser['type'],
      name: String(parsed.name || ''),
      companyName: String(parsed.companyName || ''),
      email: String(parsed.email || ''),
    }
  } catch {
    console.warn('Failed to parse session from localStorage')
    return null
  }
}

export function setSessionUser(user: AuthSessionUser): void {
  // Ensure user has safe values
  const safeUser = {
    id: String(user.id || ''),
    type: String(user.type || 'contractor'),
    name: String(user.name || ''),
    companyName: String(user.companyName || ''),
    email: String(user.email || ''),
  }

  // Save to localStorage only - authentication uses localStorage for simplicity
  localStorage.setItem('thermaquote_session', JSON.stringify(safeUser))
}

export function clearSessionUser(): void {
  // Clear from localStorage only
  localStorage.removeItem('thermaquote_session')
}
