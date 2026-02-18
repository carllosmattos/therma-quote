import type { InspectionPhoto, PreliminaryInspection, ProposalComplianceSummary, ManufacturerCertification } from '../domain/compliance'
import { getDatabase, persistDatabase, execSql, selectSql } from '../../shared/infrastructure/sqliteDb'
import { deleteImageFile, saveImageFile } from '../../shared/infrastructure/imageStorage'

export function getProposalComplianceSummary(proposalId: string): ProposalComplianceSummary {
  const db = getDatabase()
  const statusResults = selectSql(
    db,
    'SELECT status FROM preliminary_inspections WHERE proposal_id = ? ORDER BY updated_at DESC LIMIT 1',
    [proposalId],
  )

  const status = statusResults.length > 0
    ? String(statusResults[0].status)
    : 'pending'

  const photoCountResult = db.exec(
    `SELECT COUNT(*) FROM inspection_photos
     WHERE inspection_id IN (SELECT id FROM preliminary_inspections WHERE proposal_id = ?)`,
    [proposalId],
  )
  const inspectionPhotoCount = photoCountResult.length > 0 ? Number(photoCountResult[0].values[0][0]) : 0

  const certCountResult = db.exec('SELECT COUNT(*) FROM manufacturer_certifications WHERE proposal_id = ?', [proposalId])
  const manufacturerCertificationsCount = certCountResult.length > 0 ? Number(certCountResult[0].values[0][0]) : 0

  return {
    inspectionStatus: status as ProposalComplianceSummary['inspectionStatus'],
    inspectionPhotoCount,
    manufacturerCertificationsCount,
  }
}

export function getLatestPreliminaryInspection(proposalId: string): PreliminaryInspection | null {
  const db = getDatabase()
  const inspections = selectSql(
    db,
    'SELECT * FROM preliminary_inspections WHERE proposal_id = ? ORDER BY updated_at DESC LIMIT 1',
    [proposalId],
  ).map((record) => ({
    id: String(record.id),
    proposalId: String(record.proposal_id),
    status: String(record.status) as PreliminaryInspection['status'],
    inspectorName: String(record.inspector_name),
    inspectionDate: record.inspection_date ? String(record.inspection_date) : undefined,
    existingRValueValidated: Boolean(record.existing_r_value_validated),
    existingRValueFound: Number(record.existing_r_value_found),
    accessNotes: String(record.access_notes ?? ''),
    notes: String(record.notes ?? ''),
    createdAt: String(record.created_at),
    updatedAt: String(record.updated_at),
  }))

  return inspections[0] ?? null
}

export function listInspectionPhotos(inspectionId: string): InspectionPhoto[] {
  const db = getDatabase()
  return selectSql(
    db,
    'SELECT * FROM inspection_photos WHERE inspection_id = ? ORDER BY created_at DESC',
    [inspectionId]
  ).map((record) => ({
    id: String(record.id),
    inspectionId: String(record.inspection_id),
    fileName: String(record.file_name),
    filePath: String(record.file_path),
    mimeType: String(record.mime_type),
    sizeBytes: Number(record.size_bytes),
    caption: record.caption ? String(record.caption) : undefined,
    createdAt: String(record.created_at),
  }))
}

export function listManufacturerCertifications(proposalId: string): ManufacturerCertification[] {
  const db = getDatabase()
  return selectSql(
    db,
    'SELECT * FROM manufacturer_certifications WHERE proposal_id = ? ORDER BY verification_date DESC',
    [proposalId]
  ).map((record) => ({
    id: String(record.id),
    proposalId: String(record.proposal_id),
    materialKey: String(record.material_key) as ManufacturerCertification['materialKey'],
    manufacturer: String(record.manufacturer),
    certificationType: String(record.certification_type) as ManufacturerCertification['certificationType'],
    certificationNumber: record.certification_number ? String(record.certification_number) : undefined,
    certificationUrl: record.certification_url ? String(record.certification_url) : undefined,
    irsQualified: Boolean(record.irs_qualified),
    verificationDate: String(record.verification_date),
    expiryDate: record.expiry_date ? String(record.expiry_date) : undefined,
    notes: String(record.notes ?? ''),
  }))
}

export function createPreliminaryInspection(input: Omit<PreliminaryInspection, 'createdAt' | 'updatedAt'>): PreliminaryInspection {
  const db = getDatabase()
  const now = new Date().toISOString()
  const inspection: PreliminaryInspection = {
    ...input,
    createdAt: now,
    updatedAt: now,
  }

  execSql(
    db,
    `INSERT INTO preliminary_inspections (
      id, proposal_id, status, inspector_name, inspection_date, existing_r_value_validated, existing_r_value_found,
      access_notes, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      inspection.id,
      inspection.proposalId,
      inspection.status,
      inspection.inspectorName,
      inspection.inspectionDate ?? null,
      inspection.existingRValueValidated ? 1 : 0,
      inspection.existingRValueFound,
      inspection.accessNotes,
      inspection.notes,
      inspection.createdAt,
      inspection.updatedAt,
    ],
  )

  persistDatabase()
  return inspection
}

export function updatePreliminaryInspection(inspection: PreliminaryInspection): void {
  const db = getDatabase()
  execSql(
    db,
    `UPDATE preliminary_inspections SET
      status = ?, inspector_name = ?, inspection_date = ?, existing_r_value_validated = ?,
      existing_r_value_found = ?, access_notes = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      inspection.status,
      inspection.inspectorName,
      inspection.inspectionDate ?? null,
      inspection.existingRValueValidated ? 1 : 0,
      inspection.existingRValueFound,
      inspection.accessNotes,
      inspection.notes,
      inspection.updatedAt,
      inspection.id,
    ],
  )
  persistDatabase()
}

export async function addInspectionPhoto(
  inspectionId: string,
  file: File,
  caption?: string,
): Promise<InspectionPhoto> {
  const db = getDatabase()
  const stored = await saveImageFile(file)
  const photo: InspectionPhoto = {
    id: `photo-${Date.now()}`,
    inspectionId,
    fileName: stored.fileName,
    filePath: stored.filePath,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    caption,
    createdAt: new Date().toISOString(),
  }

  execSql(
    db,
    `INSERT INTO inspection_photos (
      id, inspection_id, file_name, file_path, mime_type, size_bytes, caption, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      photo.id,
      photo.inspectionId,
      photo.fileName,
      photo.filePath,
      photo.mimeType,
      photo.sizeBytes,
      photo.caption ?? null,
      photo.createdAt,
    ],
  )

  persistDatabase()
  return photo
}

export function addManufacturerCertification(input: ManufacturerCertification): void {
  const db = getDatabase()
  execSql(
    db,
    `INSERT INTO manufacturer_certifications (
      id, proposal_id, material_key, manufacturer, certification_type, certification_number,
      certification_url, irs_qualified, verification_date, expiry_date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.proposalId,
      input.materialKey,
      input.manufacturer,
      input.certificationType,
      input.certificationNumber ?? null,
      input.certificationUrl ?? null,
      input.irsQualified ? 1 : 0,
      input.verificationDate,
      input.expiryDate ?? null,
      input.notes,
    ],
  )
  persistDatabase()
}

export async function deleteInspectionPhoto(photoId: string, fileName: string): Promise<void> {
  const db = getDatabase()
  execSql(db, 'DELETE FROM inspection_photos WHERE id = ?', [photoId])
  await deleteImageFile(fileName)
  persistDatabase()
}

export function deleteManufacturerCertification(certificationId: string): void {
  const db = getDatabase()
  execSql(db, 'DELETE FROM manufacturer_certifications WHERE id = ?', [certificationId])
  persistDatabase()
}
