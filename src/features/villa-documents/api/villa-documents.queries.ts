import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toApiError } from "@/shared/api/errors"
import { invalidateVillaDocumentsAfterWrite } from "../lib/villaDocumentsQueryCache"
import * as api from "./villa-documents.api"
import type { VillaDocument } from "./villa-documents.types"

export const villaDocumentsKeys = {
  all: ["villa-documents"] as const,
  list: (villaId: string) =>
    [...villaDocumentsKeys.all, "list", villaId] as const,
}

export function useVillaDocumentsQuery(villaId: string, enabled: boolean) {
  return useQuery({
    queryKey: villaDocumentsKeys.list(villaId),
    queryFn: ({ signal }) => api.listVillaDocuments(villaId, signal),
    enabled: enabled && !!villaId,
  })
}

export function useUploadVillaDocumentMutation(villaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      file: File
      idempotencyKey: string
      signal?: AbortSignal
      onProgress?: (ratio: number) => void
    }) =>
      api.uploadVillaDocument({
        villaId,
        file: input.file,
        idempotencyKey: input.idempotencyKey,
        signal: input.signal,
        onProgress: input.onProgress,
      }),
    onSuccess: () => {
      invalidateVillaDocumentsAfterWrite(qc, villaId)
    },
  })
}

export function useDeleteVillaDocumentMutation(villaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (doc: VillaDocument) => api.deleteVillaDocument(doc.id),
    onSuccess: () => {
      invalidateVillaDocumentsAfterWrite(qc, villaId)
    },
    onError: (err) => {
      toApiError(err)
    },
  })
}
