import type { Client } from '../domain/client'
import { clients as defaultClients } from '../../../data/seedData'

const CLIENTS_KEY = 'thermaquote_clients'

type ClientsByContractor = Record<string, Client[]>

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

function listAll(): ClientsByContractor {
  return parseJson<ClientsByContractor>(localStorage.getItem(CLIENTS_KEY), {})
}

function saveAll(all: ClientsByContractor): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(all))
}

function ensureSeed(contractorId: string): ClientsByContractor {
  const all = listAll()

  if (!all[contractorId] || all[contractorId].length === 0) {
    all[contractorId] = defaultClients.map((client) => ({ ...client }))
    saveAll(all)
  }

  return all
}

export function listContractorClients(contractorId: string): Client[] {
  const all = ensureSeed(contractorId)
  return (all[contractorId] ?? []).filter((client) => !client.deletedAt)
}

export function addContractorClient(contractorId: string, input: Omit<Client, 'id'>): Client {
  const all = ensureSeed(contractorId)
  const nextClient: Client = {
    id: `client-${Date.now()}`,
    ...input,
  }

  all[contractorId] = [nextClient, ...(all[contractorId] ?? [])]
  saveAll(all)
  return nextClient
}

export function updateContractorClient(contractorId: string, clientId: string, updates: Partial<Omit<Client, 'id'>>): void {
  const all = ensureSeed(contractorId)
  const clients = all[contractorId] ?? []
  const index = clients.findIndex((client) => client.id === clientId)

  if (index !== -1) {
    clients[index] = { ...clients[index], ...updates }
    all[contractorId] = clients
    saveAll(all)
  }
}

export function deleteContractorClient(contractorId: string, clientId: string): void {
  const all = ensureSeed(contractorId)
  const clients = all[contractorId] ?? []
  const index = clients.findIndex((client) => client.id === clientId)

  if (index !== -1) {
    clients[index] = { ...clients[index], deletedAt: new Date().toISOString() }
    all[contractorId] = clients
    saveAll(all)
  }
}
