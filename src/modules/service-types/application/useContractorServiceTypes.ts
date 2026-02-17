import { useState } from 'react'
import type { ServiceType } from '../domain/serviceType'
import {
  addContractorServiceType,
  listContractorServiceTypes,
  updateContractorServiceType,
  deleteContractorServiceType,
} from '../infrastructure/serviceTypeStorage'

interface AddServiceTypeInput {
  name: string
  defaultMaterialCostPerSqFt: number
  defaultLaborCostPerSqFt: number
  supportsRValue: boolean
  defaultTargetRValue?: number
}

export function useContractorServiceTypes(contractorId: string) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(() => listContractorServiceTypes(contractorId))

  function addServiceType(input: AddServiceTypeInput) {
    addContractorServiceType(contractorId, {
      name: input.name.trim(),
      model: 'AREA_BASED',
      defaultMaterialCostPerSqFt: input.defaultMaterialCostPerSqFt,
      defaultLaborCostPerSqFt: input.defaultLaborCostPerSqFt,
      supportsRValue: input.supportsRValue,
      defaultTargetRValue: input.supportsRValue ? input.defaultTargetRValue ?? 13 : undefined,
    })
    setServiceTypes(listContractorServiceTypes(contractorId))
  }

  function updateServiceType(serviceTypeId: string, updates: Partial<Omit<ServiceType, 'id'>>) {
    updateContractorServiceType(contractorId, serviceTypeId, updates)
    setServiceTypes(listContractorServiceTypes(contractorId))
  }

  function deleteServiceType(serviceTypeId: string) {
    deleteContractorServiceType(contractorId, serviceTypeId)
    setServiceTypes(listContractorServiceTypes(contractorId))
  }

  function reloadServiceTypes() {
    setServiceTypes(listContractorServiceTypes(contractorId))
  }

  return {
    serviceTypes,
    addServiceType,
    updateServiceType,
    deleteServiceType,
    reloadServiceTypes,
  }
}
