export interface Company {
  id: string
  name: string
  laborCostPerSqFt: number
  defaultMarginRate: number
  credentials?: CompanyCredentials
}

export interface InsurancePolicy {
  policyType: 'general-liability' | 'workers-comp' | 'umbrella'
  provider: string
  policyNumber: string
  coverageAmount: string
  expiryDate: string
  documentUrl?: string
}

export interface ProfessionalCertification {
  type: 'bpi' | 'resnet' | 'energy-auditor' | 'other'
  certNumber: string
  issueDate: string
  expiryDate?: string
  issuingBody: string
  documentUrl?: string
}

export interface CompanyCredentials {
  licenseNumber: string
  licenseState: string
  licenseType: string
  licenseExpiryDate: string
  licenseVerificationUrl?: string
  insurancePolicies: InsurancePolicy[]
  certifications: ProfessionalCertification[]
  backgroundCheckCompleted: boolean
  backgroundCheckDate?: string
}
