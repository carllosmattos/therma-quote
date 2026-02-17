export type CalculationModel = 'AREA_BASED'

export interface ServiceType {
  id: string
  name: string
  model: CalculationModel
  defaultMaterialCostPerSqFt: number
  defaultLaborCostPerSqFt: number
  supportsRValue: boolean
  defaultTargetRValue?: number
  deletedAt?: string
}
