import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthSessionUser, ContractorUser } from '../domain/contractorUser'
import { AuthContext } from './auth-context'
import {
  clearSessionUser,
  getSessionUser,
  listContractorUsers,
  saveContractorUsers,
  setSessionUser,
} from '../infrastructure/authStorage'
import type { LoginInput, RegisterInput } from './auth-context'

function toSessionUser(user: ContractorUser): AuthSessionUser {
  return {
    id: user.id,
    type: user.type,
    name: user.name,
    companyName: user.companyName,
    email: user.email,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(() => getSessionUser())

  async function login(input: LoginInput) {
    const users = listContractorUsers()
    const found = users.find((item) => item.email.toLowerCase() === input.email.toLowerCase())

    if (!found || found.password !== input.password) {
      return { ok: false as const, message: 'Invalid email or password.' }
    }

    const sessionUser = toSessionUser(found)
    setSessionUser(sessionUser)
    setUser(sessionUser)
    return { ok: true as const }
  }

  async function register(input: RegisterInput) {
    const users = listContractorUsers()
    
    const exists = users.some((item) => item.email.toLowerCase() === input.email.toLowerCase())

    if (exists) {
      return { ok: false as const, message: 'This email is already registered.' }
    }

    const nextUser: ContractorUser = {
      id: `contractor-${Date.now()}`,
      type: 'contractor',
      name: input.name.trim(),
      companyName: input.companyName.trim(),
      email: input.email.trim(),
      password: input.password,
    }

    const nextUsers = [...users, nextUser]
    
    saveContractorUsers(nextUsers)

    const sessionUser = toSessionUser(nextUser)
    setSessionUser(sessionUser)
    setUser(sessionUser)

    return { ok: true as const }
  }

  function logout() {
    clearSessionUser()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
