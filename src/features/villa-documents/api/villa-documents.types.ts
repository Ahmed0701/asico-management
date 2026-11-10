export type VillaDocumentUploader = {
  id: string
  name: string
}

export type VillaDocument = {
  id: string
  villaId: string
  originalName: string
  sizeBytes: number
  mimeType: string
  uploadedBy: VillaDocumentUploader
  createdAt: string
}
