const IMAGE_DIR = 'uploads'

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function getImagesDirectory(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle(IMAGE_DIR, { create: true })
}

export interface StoredImageInfo {
  fileName: string
  filePath: string
  mimeType: string
  sizeBytes: number
}

export async function saveImageFile(file: File): Promise<StoredImageInfo> {
  const directory = await getImagesDirectory()
  const timestamp = Date.now()
  const safeName = sanitizeFileName(file.name)
  const fileName = `${timestamp}-${safeName}`
  const handle = await directory.getFileHandle(fileName, { create: true })
  const writable = await handle.createWritable()

  await writable.write(file)
  await writable.close()

  return {
    fileName,
    filePath: `${IMAGE_DIR}/${fileName}`,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  }
}

export async function loadImageUrl(fileName: string): Promise<string> {
  const directory = await getImagesDirectory()
  const handle = await directory.getFileHandle(fileName)
  const file = await handle.getFile()
  return URL.createObjectURL(file)
}

export async function deleteImageFile(fileName: string): Promise<void> {
  const directory = await getImagesDirectory()
  await directory.removeEntry(fileName)
}
