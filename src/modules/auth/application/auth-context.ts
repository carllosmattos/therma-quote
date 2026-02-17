import { createContext } from 'react'
import type { AuthSessionUser } from '../domain/contractorUser'

export interface RegisterInput {
  name: string
  companyName: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthContextValue {
  user: AuthSessionUser | null
  login: (input: LoginInput) => Promise<{ ok: true } | { ok: false; message: string }>
  register: (input: RegisterInput) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
