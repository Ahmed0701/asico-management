/** A site image of a villa: a JPEG or PNG photo. `uploadedBy` is null when that user was deleted. */
export type VillaImage = {
  id: string
  villaId: string
  name: string
  mime: string
  size: number
  uploadedBy: {
    id: string
    name: string
  } | null
  uploadedAt: string
}

/** At most this many photos in one upload, and on one villa. */
export const MAX_IMAGES_PER_UPLOAD = 20
export const MAX_IMAGES_PER_VILLA = 200

/** The photos the server takes. */
export const IMAGE_ACCEPT = "image/jpeg,image/png"
