import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import type { VillaImage } from "./villa-images.types"

export const villaImagesKeys = {
  all: ["villa-images"] as const,
  villa: (villaId: string) => [...villaImagesKeys.all, villaId] as const,
  file: (id: string) => [...villaImagesKeys.all, "file", id] as const,
}

export async function listVillaImages(villaId: string): Promise<VillaImage[]> {
  return unwrap(api.get<ApiSuccess<VillaImage[]>>(`/villas/${villaId}/images`))
}

export async function uploadVillaImages(
  villaId: string,
  files: File[],
): Promise<VillaImage[]> {
  const form = new FormData()
  for (const file of files) form.append("file", file)
  return unwrap(
    api.post<ApiSuccess<VillaImage[]>>(`/villas/${villaId}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  )
}

export async function deleteVillaImage(id: string): Promise<void> {
  await api.delete(`/villa-images/${id}`)
}

// The image fetched with the session (an <img> cannot send it), held as a local URL.
export async function fetchVillaImageUrl(id: string): Promise<string> {
  const res = await api.get<Blob>(`/villa-images/${id}/file`, {
    responseType: "blob",
  })
  return URL.createObjectURL(res.data)
}

/** The villa's images, fetched only when `enabled` (the section is open). */
export function useVillaImagesQuery(villaId: string, enabled: boolean) {
  return useQuery({
    queryKey: villaImagesKeys.villa(villaId),
    queryFn: () => listVillaImages(villaId),
    enabled,
    retry: 1,
  })
}

/** One image as a local URL, kept while the page is open (an image does not change). */
export function useVillaImageUrl(id: string) {
  return useQuery({
    queryKey: villaImagesKeys.file(id),
    queryFn: () => fetchVillaImageUrl(id),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}

type UploadArgs = {
  villaId: string
  files: File[]
}

export function useUploadVillaImagesMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ villaId, files }: UploadArgs) =>
      uploadVillaImages(villaId, files),
    onSuccess: (data, { villaId }) => {
      qc.setQueryData(villaImagesKeys.villa(villaId), data)
    },
  })
}

type DeleteArgs = {
  id: string
  villaId: string
}

export function useDeleteVillaImageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: DeleteArgs) => deleteVillaImage(id),
    onSuccess: (_data, { id, villaId }) => {
      qc.setQueryData<VillaImage[]>(villaImagesKeys.villa(villaId), (list) =>
        list?.filter((image) => image.id !== id),
      )
      const url = qc.getQueryData<string>(villaImagesKeys.file(id))
      if (url) URL.revokeObjectURL(url)
      qc.removeQueries({ queryKey: villaImagesKeys.file(id) })
    },
  })
}
