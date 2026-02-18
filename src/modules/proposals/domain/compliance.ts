import type { InsulationMaterialKey } from './insulationCatalog'

export type InspectionStatus = 'pending' | 'scheduled' | 'in-progress' | 'completed'

export interface InspectionPhoto {
  id: string
  inspectionId: string
  fileName: string
  filePath: string
  mimeType: string
  sizeBytes: number
  caption?: string
  createdAt: string
}

export interface PreliminaryInspection {
  id: string
  proposalId: string
  status: InspectionStatus
  inspectorName: string
  inspectionDate?: string
  existingRValueValidated: boolean
  existingRValueFound: number
  accessNotes: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type CertificationType =
  | 'astm-c739'
  | 'astm-c764'
  | 'astm-c665'
  | 'astm-c578'
  | 'manufacturer-certified'

export interface ManufacturerCertification {
  id: string
  proposalId: string
  materialKey: InsulationMaterialKey
  manufacturer: string
  certificationType: CertificationType
  certificationNumber?: string
  certificationUrl?: string
  irsQualified: boolean
  verificationDate: string
  expiryDate?: string
  notes: string
}

export interface ProposalComplianceSummary {
  inspectionStatus: InspectionStatus
  inspectionPhotoCount: number
  manufacturerCertificationsCount: number
}
