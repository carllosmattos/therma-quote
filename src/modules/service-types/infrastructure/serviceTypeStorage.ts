import type { ServiceType } from '../domain/serviceType'
import { serviceTypes as defaultServiceTypes } from '../../../data/seedData'

const SERVICE_TYPES_KEY = 'thermaquote_service_types'

type ServicesByContractor = Record<string, ServiceType[]>

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

function listAll(): ServicesByContractor {
  return parseJson<ServicesByContractor>(localStorage.getItem(SERVICE_TYPES_KEY), {})
}

function saveAll(all: ServicesByContractor): void {
  localStorage.setItem(SERVICE_TYPES_KEY, JSON.stringify(all))
}

function ensureSeed(contractorId: string): ServicesByContractor {
  const all = listAll()

  if (!all[contractorId] || all[contractorId].length === 0) {
    all[contractorId] = defaultServiceTypes.map((serviceType) => ({ ...serviceType }))
    saveAll(all)
  }

  return all
}

export function listContractorServiceTypes(contractorId: string): ServiceType[] {
  const all = ensureSeed(contractorId)
  return (all[contractorId] ?? []).filter((serviceType) => !serviceType.deletedAt)
}

export function addContractorServiceType(contractorId: string, input: Omit<ServiceType, 'id'>): ServiceType {
  const all = ensureSeed(contractorId)
  const nextServiceType: ServiceType = {
    id: `svc-${Date.now()}`,
    ...input,
  }

  all[contractorId] = [nextServiceType, ...(all[contractorId] ?? [])]
  saveAll(all)
  return nextServiceType
}

export function updateContractorServiceType(
  contractorId: string,
  serviceTypeId: string,
  updates: Partial<Omit<ServiceType, 'id'>>,
): void {
  const all = ensureSeed(contractorId)
  const serviceTypes = all[contractorId] ?? []
  const index = serviceTypes.findIndex((item) => item.id === serviceTypeId)

  if (index >= 0) {
    serviceTypes[index] = { ...serviceTypes[index], ...updates }
    all[contractorId] = serviceTypes
    saveAll(all)
  }
}

export function deleteContractorServiceType(contractorId: string, serviceTypeId: string): void {
  const all = ensureSeed(contractorId)
  const serviceTypes = all[contractorId] ?? []
  const index = serviceTypes.findIndex((item) => item.id === serviceTypeId)

  if (index >= 0) {
    serviceTypes[index] = { ...serviceTypes[index], deletedAt: new Date().toISOString() }
    all[contractorId] = serviceTypes
    saveAll(all)
  }
}
