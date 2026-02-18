import type { Client } from '../domain/client'
import { clients as defaultClients } from '../../../data/seedData'
import { getDatabase, persistDatabase, selectSql, execSql } from '../../shared/infrastructure/sqliteDb'

function ensureSeed(contractorId: string): void {
  const db = getDatabase()
  
  const countResults = selectSql(db, 'SELECT COUNT(*) as count FROM clients WHERE contractor_id = ?', [contractorId])
  const count = countResults.length > 0 ? Number(countResults[0].count) : 0

  if (count > 0) {
    return
  }

  defaultClients.forEach((client) => {
    execSql(
      db,
      `INSERT OR IGNORE INTO clients (id, contractor_id, name, email, phone, street, city, state, zip_code, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client.id,
        contractorId,
        client.name,
        client.email ?? '',
        client.phone ?? '',
        client.street ?? '',
        client.city ?? '',
        client.state ?? '',
        client.zipCode ?? '',
        client.deletedAt ?? null,
      ]
    )
  })

  persistDatabase()
}

export function listContractorClients(contractorId: string): Client[] {
  ensureSeed(contractorId)
  const db = getDatabase()
  
  const results = selectSql(
    db,
    'SELECT * FROM clients WHERE contractor_id = ? AND deleted_at IS NULL ORDER BY name',
    [contractorId]
  )

  if (results.length === 0) {
    return []
  }

  return results.map((record: Record<string, unknown>) => {
    return {
      id: String(record.id),
      name: String(record.name),
      email: String(record.email ?? ''),
      phone: String(record.phone ?? ''),
      street: String(record.street ?? ''),
      city: String(record.city ?? ''),
      state: String(record.state ?? ''),
      zipCode: String(record.zip_code ?? ''),
      deletedAt: record.deleted_at ? String(record.deleted_at) : undefined,
    }
  })
}

export function addContractorClient(contractorId: string, input: Omit<Client, 'id'>): Client {
  ensureSeed(contractorId)
  const db = getDatabase()
  const nextClient: Client = {
    id: `client-${Date.now()}`,
    ...input,
  }

  try {
    execSql(
      db,
      `INSERT INTO clients (id, contractor_id, name, email, phone, street, city, state, zip_code, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextClient.id,
        contractorId,
        nextClient.name,
        nextClient.email ?? '',
        nextClient.phone ?? '',
        nextClient.street ?? '',
        nextClient.city ?? '',
        nextClient.state ?? '',
        nextClient.zipCode ?? '',
        nextClient.deletedAt ?? null,
      ]
    )
    persistDatabase()
    
  } catch (err) {
    console.error('[addContractorClient] Error adding client:', err)
    throw err
  }
  return nextClient
}

export function updateContractorClient(contractorId: string, clientId: string, updates: Partial<Omit<Client, 'id'>>): void {
  ensureSeed(contractorId)
  const db = getDatabase()

  execSql(
    db,
    `UPDATE clients SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone),
     street = COALESCE(?, street), city = COALESCE(?, city), state = COALESCE(?, state),
     zip_code = COALESCE(?, zip_code)
     WHERE id = ? AND contractor_id = ?`,
    [
      updates.name ?? null,
      updates.email ?? null,
      updates.phone ?? null,
      updates.street ?? null,
      updates.city ?? null,
      updates.state ?? null,
      updates.zipCode ?? null,
      clientId,
      contractorId,
    ]
  )

  persistDatabase()
}

export function deleteContractorClient(contractorId: string, clientId: string): void {
  ensureSeed(contractorId)
  const db = getDatabase()
  execSql(db, 'UPDATE clients SET deleted_at = ? WHERE id = ? AND contractor_id = ?', [new Date().toISOString(), clientId, contractorId])
  persistDatabase()
}
