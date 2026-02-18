import initSqlJs from 'sql.js'
import type { Database, SqlJsStatic } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { company as seedCompany } from '../../../data/seedData'
import type { Company } from '../../company/domain/company'

const IDB_NAME = 'thermaquote-sqlite'
const IDB_STORE = 'db'
const IDB_KEY = 'main'
const MIGRATION_KEY = 'migrated_from_localstorage'

let sqlModule: SqlJsStatic | null = null
let database: Database | null = null
let persistTimer: number | null = null

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function loadDbFromIdb(): Promise<Uint8Array | null> {
  const db = await openIdb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDB_STORE, 'readonly')
    const store = transaction.objectStore(IDB_STORE)
    const request = store.get(IDB_KEY)

    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

async function saveDbToIdb(data: Uint8Array): Promise<void> {
  const db = await openIdb()

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(IDB_STORE, 'readwrite')
    const store = transaction.objectStore(IDB_STORE)
    const request = store.put(data, IDB_KEY)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function resetDatabaseStorage(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(IDB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

export async function resetLocalDatabase(): Promise<void> {
  await resetDatabaseStorage()
  database = null
}

function queuePersist(): void {
  if (persistTimer) {
    window.clearTimeout(persistTimer)
  }

  persistTimer = window.setTimeout(() => {
    if (!database) {
      return
    }

    const data = database.export()
    void saveDbToIdb(data)
  }, 250)
}

function applySchema(db: Database): void {
  db.exec('PRAGMA foreign_keys = ON;')

  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      labor_cost_per_sq_ft REAL NOT NULL,
      default_margin_rate REAL NOT NULL,
      credentials_json TEXT
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      contractor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      street TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS service_types (
      id TEXT PRIMARY KEY,
      contractor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      default_material_cost_per_sq_ft REAL NOT NULL,
      default_labor_cost_per_sq_ft REAL NOT NULL,
      supports_r_value INTEGER NOT NULL,
      default_target_r_value REAL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      contractor_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      climate_zone INTEGER NOT NULL,
      status TEXT NOT NULL,
      subtotal REAL NOT NULL,
      suggested_total REAL NOT NULL,
      tax_credit REAL NOT NULL,
      net_price REAL NOT NULL,
      final_total REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      note TEXT,
      deleted_at TEXT,
      total_estimated_annual_savings REAL,
      total_estimated_monthly_average REAL,
      recommended_payback_period REAL,
      pricing_tier TEXT,
      compliance_summary_json TEXT
    );

    CREATE TABLE IF NOT EXISTS proposal_line_items (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      service_area TEXT NOT NULL,
      application TEXT NOT NULL,
      material_key TEXT NOT NULL,
      material_name TEXT NOT NULL,
      material_r_value_per_inch REAL NOT NULL,
      target_r_value REAL NOT NULL,
      existing_r_value REAL NOT NULL,
      r_value_to_install REAL NOT NULL,
      depth_inches REAL NOT NULL,
      area_sq_ft REAL NOT NULL,
      waste_factor_pct REAL NOT NULL,
      effective_area_sq_ft REAL NOT NULL,
      material_cost_per_sq_ft REAL NOT NULL,
      labor_cost_per_sq_ft REAL NOT NULL,
      coverage_factor REAL NOT NULL,
      material_quantity REAL NOT NULL,
      material_unit TEXT NOT NULL,
      mobilization_cost REAL NOT NULL,
      additional_scopes_json TEXT NOT NULL,
      additional_scopes_total REAL NOT NULL,
      subtotal REAL NOT NULL,
      margin_rate REAL NOT NULL,
      margin_value REAL NOT NULL,
      suggested_total REAL NOT NULL,
      final_total REAL NOT NULL,
      note TEXT,
      tax_credit REAL NOT NULL,
      tax_credit_max REAL NOT NULL,
      tax_credit_percentage REAL NOT NULL,
      estimated_annual_savings REAL,
      estimated_monthly_average REAL,
      payback_period REAL,
      energy_percent_reduction TEXT,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS preliminary_inspections (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      status TEXT NOT NULL,
      inspector_name TEXT NOT NULL,
      inspection_date TEXT,
      existing_r_value_validated INTEGER NOT NULL,
      existing_r_value_found REAL NOT NULL,
      access_notes TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inspection_photos (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      caption TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (inspection_id) REFERENCES preliminary_inspections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS manufacturer_certifications (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      material_key TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      certification_type TEXT NOT NULL,
      certification_number TEXT,
      certification_url TEXT,
      irs_qualified INTEGER NOT NULL,
      verification_date TEXT NOT NULL,
      expiry_date TEXT,
      notes TEXT NOT NULL,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      email TEXT NOT NULL
    );
  `)
}

function getMetadata(db: Database, key: string): string | null {
  const results = selectSql(db, 'SELECT value FROM metadata WHERE key = ?', [key])
  if (results.length === 0) {
    return null
  }
  return String(results[0].value)
}

function setMetadata(db: Database, key: string, value: string): void {
  execSql(db, 'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', [key, value])
}

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

/** Execute SQL with parameters using prepare/bind/step */
function seedCompanyIfMissing(db: Database): void {
  try {
    const results = selectSql(db, 'SELECT id FROM companies WHERE id = ?', [seedCompany.id])
    if (results.length > 0) {
      return
    }

    // Ensure name is NEVER null or falsy
    let safeName = 'ThermaQuote'
    if (seedCompany && seedCompany.name) {
      const trimmed = String(seedCompany.name).trim()
      if (trimmed) {
        safeName = trimmed
      }
    }

    const safeLabor = Number.isFinite(seedCompany?.laborCostPerSqFt) ? seedCompany.laborCostPerSqFt : 0
    const safeMargin = Number.isFinite(seedCompany?.defaultMarginRate) ? seedCompany.defaultMarginRate : 0
    const credentialsJson = seedCompany?.credentials ? JSON.stringify(seedCompany.credentials) : null

    execSql(
      db,
      'INSERT INTO companies (id, name, labor_cost_per_sq_ft, default_margin_rate, credentials_json) VALUES (?, ?, ?, ?, ?)',
      [seedCompany.id || 'co-default', safeName, safeLabor, safeMargin, credentialsJson]
    )
  } catch (err) {
    console.error('[seedCompanyIfMissing] Error during seed:', err)
    // If seed fails, make sure at least one company exists with safe defaults
    const countResults = selectSql(db, 'SELECT COUNT(*) as count FROM companies')
    const count = countResults.length > 0 ? Number(countResults[0].count) : 0
    
    if (count === 0) {
      try {
        execSql(
          db,
          'INSERT INTO companies (id, name, labor_cost_per_sq_ft, default_margin_rate, credentials_json) VALUES (?, ?, ?, ?, ?)',
          ['co-default', 'ThermaQuote', 0, 0, null]
        )
      } catch {
        // Already exists, ignored
      }
    }
  }
}

function repairCompanyDefaults(db: Database): void {
  try {
    // Fix NULL names by setting them to seed company name
    const safeName = (seedCompany?.name?.trim() || 'ThermaQuote')
    db.exec(
      "UPDATE companies SET name = ? WHERE name IS NULL OR name = ''",
      [safeName],
    )
    
    // Fix NULL labor cost
    db.exec(
      "UPDATE companies SET labor_cost_per_sq_ft = 0 WHERE labor_cost_per_sq_ft IS NULL",
    )
    
    // Fix NULL margin rate
    db.exec(
      "UPDATE companies SET default_margin_rate = 0 WHERE default_margin_rate IS NULL",
    )
  } catch (err) {
    // Repair failures are non-critical
    console.warn('Company repair failed (non-critical):', err)
  }
}

function migrateLocalStorage(db: Database): void {
  const alreadyMigrated = getMetadata(db, MIGRATION_KEY)
  if (alreadyMigrated === 'true') {
    return
  }

  const proposals = parseJson<any[]>(localStorage.getItem('thermaquote_proposals'), [])
  const clientsByContractor = parseJson<Record<string, any[]>>(localStorage.getItem('thermaquote_clients'), {})
  const servicesByContractor = parseJson<Record<string, any[]>>(localStorage.getItem('thermaquote_service_types'), {})

  proposals.forEach((proposal) => {
    const complianceSummaryJson = proposal.complianceSummary ? JSON.stringify(proposal.complianceSummary) : null
    db.exec(
      `INSERT OR REPLACE INTO proposals (
        id, contractor_id, company_id, client_id, climate_zone, status, subtotal, suggested_total,
        tax_credit, net_price, final_total, created_at, updated_at, note, deleted_at,
        total_estimated_annual_savings, total_estimated_monthly_average, recommended_payback_period,
        pricing_tier, compliance_summary_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        proposal.id,
        proposal.contractorId,
        proposal.companyId,
        proposal.clientId,
        proposal.climateZone,
        proposal.status,
        proposal.subtotal,
        proposal.suggestedTotal ?? proposal.subtotal,
        proposal.taxCredit ?? 0,
        proposal.netPrice ?? proposal.subtotal,
        proposal.finalTotal ?? proposal.subtotal,
        proposal.createdAt,
        proposal.updatedAt,
        proposal.note ?? '',
        proposal.deletedAt ?? null,
        proposal.totalEstimatedAnnualSavings ?? null,
        proposal.totalEstimatedMonthlyAverage ?? null,
        proposal.recommendedPaybackPeriod ?? null,
        proposal.pricingTier ?? null,
        complianceSummaryJson,
      ],
    )

    const lineItems = Array.isArray(proposal.lineItems) ? proposal.lineItems : []
    lineItems.forEach((item: any) => {
      const scopesJson = JSON.stringify(item.additionalScopes ?? [])
      db.exec(
        `INSERT OR REPLACE INTO proposal_line_items (
          id, proposal_id, service_area, application, material_key, material_name, material_r_value_per_inch,
          target_r_value, existing_r_value, r_value_to_install, depth_inches, area_sq_ft, waste_factor_pct,
          effective_area_sq_ft, material_cost_per_sq_ft, labor_cost_per_sq_ft, coverage_factor, material_quantity,
          material_unit, mobilization_cost, additional_scopes_json, additional_scopes_total, subtotal, margin_rate,
          margin_value, suggested_total, final_total, note, tax_credit, tax_credit_max, tax_credit_percentage,
          estimated_annual_savings, estimated_monthly_average, payback_period, energy_percent_reduction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          proposal.id,
          item.serviceArea,
          item.application,
          item.materialKey,
          item.materialName,
          item.materialRValuePerInch,
          item.targetRValue,
          item.existingRValue,
          item.rValueToInstall,
          item.depthInches,
          item.areaSqFt,
          item.wasteFactorPct,
          item.effectiveAreaSqFt,
          item.materialCostPerSqFt,
          item.laborCostPerSqFt,
          item.coverageFactor,
          item.materialQuantity,
          item.materialUnit,
          item.mobilizationCost,
          scopesJson,
          item.additionalScopesTotal ?? 0,
          item.subtotal ?? 0,
          item.marginRate ?? 0,
          item.marginValue ?? 0,
          item.suggestedTotal ?? 0,
          item.finalTotal ?? 0,
          item.note ?? '',
          item.taxCredit ?? 0,
          item.taxCreditMax ?? 0,
          item.taxCreditPercentage ?? 0,
          item.estimatedAnnualSavings ?? null,
          item.estimatedMonthlyAverage ?? null,
          item.paybackPeriod ?? null,
          item.energyPercentReduction ?? null,
        ],
      )
    })
  })

  Object.entries(clientsByContractor).forEach(([contractorId, clients]) => {
    clients.forEach((client) => {
      db.exec(
        `INSERT OR REPLACE INTO clients (
          id, contractor_id, name, email, phone, street, city, state, zip_code, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        ],
      )
    })
  })

  Object.entries(servicesByContractor).forEach(([contractorId, services]) => {
    services.forEach((service) => {
      db.exec(
        `INSERT OR REPLACE INTO service_types (
          id, contractor_id, name, model, default_material_cost_per_sq_ft, default_labor_cost_per_sq_ft,
          supports_r_value, default_target_r_value, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          service.id,
          contractorId,
          service.name,
          service.model,
          service.defaultMaterialCostPerSqFt,
          service.defaultLaborCostPerSqFt,
          service.supportsRValue ? 1 : 0,
          service.defaultTargetRValue ?? null,
          service.deletedAt ?? null,
        ],
      )
    })
  })

  // NOTE: Users and sessions are stored in localStorage only for authentication
  // SQLite is used only for businesses data (proposals, clients, services, companies)
  // This avoids authentication migration issues

  setMetadata(db, MIGRATION_KEY, 'true')
}

export async function initDatabase(): Promise<void> {
  if (database) {
    return
  }

  if (!sqlModule) {
    sqlModule = await initSqlJs({ locateFile: () => wasmUrl })
  }

  // Try to load persisted database first
  try {
    const persisted = await loadDbFromIdb()
    if (persisted) {
      try {
        database = new sqlModule.Database(persisted)
        
        // Verify the persisted DB is valid by running a simple query
        applySchema(database)
        repairCompanyDefaults(database)
        seedCompanyIfMissing(database)
        migrateLocalStorage(database)
        queuePersist()
        return
      } catch (err) {
        // Persisted DB is corrupted, will try fresh
        console.warn('[initDatabase] Persisted database corrupted, creating fresh:', err)
        database = null
      }
    }
  } catch (err) {
    // Error loading from IDB, will try fresh
    console.warn('[initDatabase] Error loading persisted database, creating fresh:', err)
    database = null
  }

  // Fallback to fresh database
  try {
    await resetDatabaseStorage()
    database = new sqlModule.Database()
    
    // Create schema with explicit error handling
    applySchema(database)
    
    // Ensure company exists
    seedCompanyIfMissing(database)
    
    // Migrate any localStorage data
    migrateLocalStorage(database)
    
    queuePersist()
    return
  } catch (err) {
    console.error('[initDatabase] Fresh database initialization failed:', err)
    database = null
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Database initialization failed: ${message}`)
  }
}

export function execSql(db: Database, sql: string, params: unknown[] = []): void {
  // sql.js doesn't support parameterized queries. When params are provided,
  // we need to escape them and build the query string manually.
  // For simple inserts/updates/deletes, build the statement with escaped values.
  let finalSql = sql
  
  if (params.length > 0) {
    // Simple parameter substitution - NOT safe for untrusted input!
    // This is OK for this MVP since data is local-only
    params.forEach((param) => {
      let value: string
      if (param === null || param === undefined) {
        value = 'NULL'
      } else if (typeof param === 'string') {
        value = `'${String(param).replace(/'/g, "''")}'`
      } else if (typeof param === 'number') {
        value = String(param)
      } else if (typeof param === 'boolean') {
        value = param ? '1' : '0'
      } else {
        value = `'${JSON.stringify(param).replace(/'/g, "''")}'`
      }
      finalSql = finalSql.replace('?', value)
    })
  }
  
  try {
    db.exec(finalSql)
  } catch (err) {
    console.error('[execSql] Execution failed:', err, 'SQL was:', finalSql)
    throw err
  }
}

export function selectSql(db: Database, sql: string, params: unknown[] = []): Array<Record<string, unknown>> {
  // sql.js doesn't support parameterized SELECT. We need to interpolate params into the query.
  let finalSql = sql
  
  if (params.length > 0) {
    // Simple parameter substitution - NOT safe for untrusted input!
    // This is OK for this MVP since data is local-only
    params.forEach((param) => {
      let value: string
      if (param === null || param === undefined) {
        value = 'NULL'
      } else if (typeof param === 'string') {
        value = `'${String(param).replace(/'/g, "''")}'`
      } else if (typeof param === 'number') {
        value = String(param)
      } else if (typeof param === 'boolean') {
        value = param ? '1' : '0'
      } else {
        value = `'${JSON.stringify(param).replace(/'/g, "''")}'`
      }
      finalSql = finalSql.replace('?', value)
    })
  }
  
  try {
    const result = db.exec(finalSql)
    
    if (!result || result.length === 0) {
      return []
    }
    
    // Note: sql.js returns { columns: [...], values: [...] } but at runtime sometimes shows as "lc"
    // Use the result[0] structure as-is with proper type casting
    const resultSet = result[0] as { columns?: string[]; values?: unknown[][] }
    const columns = resultSet.columns ?? (result[0] as unknown as { lc: string[] }).lc
    const values = resultSet.values
    
    if (!columns || !values || values.length === 0) {
      return []
    }
    
    const mapped = values.map((row: unknown[]) => {
      const record: Record<string, unknown> = {}
      if (Array.isArray(columns) && Array.isArray(row)) {
        columns.forEach((column: string, index: number) => {
          record[column] = row[index]
        })
      }
      return record
    })
    return mapped
  } catch (err) {
    console.error('[selectSql] Error executing query:', finalSql, err)
    return []
  }
}

export function getDatabase(): Database {
  if (!database) {
    throw new Error('Database not initialized. Call initDatabase() before using storage modules.')
  }
  return database
}

export function getDatabaseSafe(): Database | null {
  return database ?? null
}

export function persistDatabase(): void {
  queuePersist()
}

export function upsertCompany(company: Company): void {
  const db = getDatabase()
  
  // Validate and sanitize company data
  const safeId = String(company?.id || 'co-default').trim()
  const safeName = (typeof company?.name === 'string' && company.name.trim()) || 'ThermaQuote'
  const safeLabor = Number.isFinite(company?.laborCostPerSqFt) ? company.laborCostPerSqFt : 0
  const safeMargin = Number.isFinite(company?.defaultMarginRate) ? company.defaultMarginRate : 0
  const credentialsJson = company?.credentials ? JSON.stringify(company.credentials) : null

  if (!safeId) {
    throw new Error('Company must have an id')
  }
  if (!safeName) {
    throw new Error('Company must have a name')
  }

  // Delete first to ensure clean insert (avoids NULL constraint issues from corrupted persisted DB)
  execSql(db, 'DELETE FROM companies WHERE id = ?', [safeId])
  
  // Then insert with guaranteed safe values
  execSql(
    db,
    'INSERT INTO companies (id, name, labor_cost_per_sq_ft, default_margin_rate, credentials_json) VALUES (?, ?, ?, ?, ?)',
    [safeId, safeName, safeLabor, safeMargin, credentialsJson]
  )

  queuePersist()
}
