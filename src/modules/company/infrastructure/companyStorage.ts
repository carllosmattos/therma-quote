import type { Company } from '../domain/company'
import { getDatabase, persistDatabase, upsertCompany, selectSql } from '../../shared/infrastructure/sqliteDb'
import { company as seedCompany } from '../../../data/seedData'

export function getCompany(companyId: string): Company {
  const db = getDatabase()
  
  const results = selectSql(db, 'SELECT * FROM companies WHERE id = ?', [companyId])

  if (results.length === 0) {
    upsertCompany(seedCompany)
    return seedCompany
  }

  const record = results[0]

  return {
    id: String(record.id),
    name: String(record.name),
    laborCostPerSqFt: Number(record.labor_cost_per_sq_ft),
    defaultMarginRate: Number(record.default_margin_rate),
    credentials: record.credentials_json ? JSON.parse(String(record.credentials_json)) : undefined,
  }
}

export function saveCompany(company: Company): void {
  upsertCompany(company)
  persistDatabase()
}
