import { useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import VillaDocumentsTable from "@/features/villa-documents/components/VillaDocumentsTable"
import VillaDocumentUploadZone from "@/features/villa-documents/components/VillaDocumentUploadZone"
import {
  downloadVillaDocument,
  useDeleteVillaDocumentMutation,
  useVillaDocumentsQuery,
  viewVillaDocument,
  villaDocumentApiErrorMessage,
} from "@/features/villa-documents/api"
import type { VillaDocument } from "@/features/villa-documents/api"
import { toApiError } from "@/shared/api/errors"
import { ConfirmModal } from "@/shared/ui/Modal"
import { toast } from "@/shared/lib/toast"

export default function VillaDetailDocumentsPanel({
  villaId,
}: {
  villaId: string
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canList = can("villa-documents:download")
  const canUpload = can("villa-documents:upload")
  const canDownload = can("villa-documents:download")
  const canDelete = can("villa-documents:delete")

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useVillaDocumentsQuery(villaId, canList)
  const remove = useDeleteVillaDocumentMutation(villaId)
  const [deleting, setDeleting] = useState<VillaDocument | null>(null)
  const [downloadPendingId, setDownloadPendingId] = useState<string | null>(
    null,
  )

  if (!canList) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("villaDocuments.noListPermission")}
      </p>
    )
  }

  const handleDownload = async (doc: VillaDocument) => {
    setDownloadPendingId(doc.id)
    try {
      await downloadVillaDocument(doc.id)
    } catch (err) {
      toast.error(villaDocumentApiErrorMessage(t, toApiError(err)))
    } finally {
      setDownloadPendingId(null)
    }
  }

  const handleView = async (doc: VillaDocument) => {
    setDownloadPendingId(doc.id)
    try {
      await viewVillaDocument(doc.id)
    } catch (err) {
      toast.error(villaDocumentApiErrorMessage(t, toApiError(err)))
    } finally {
      setDownloadPendingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting)
      setDeleting(null)
      toast.success(t("villaDocuments.deleteSuccess"))
    } catch (err) {
      toast.error(villaDocumentApiErrorMessage(t, toApiError(err)))
    }
  }

  return (
    <div className="space-y-4">
      {isError && (
        <p className="text-sm text-danger" role="alert">
          {villaDocumentApiErrorMessage(t, toApiError(error))}
        </p>
      )}
      {canUpload && (
        <VillaDocumentUploadZone
          villaId={villaId}
          documentCount={rows.length}
          disabled={isLoading}
        />
      )}
      <VillaDocumentsTable
        rows={rows}
        isLoading={isLoading}
        canDownload={canDownload}
        canDelete={canDelete}
        downloadPendingId={downloadPendingId}
        onDownload={(doc) => void handleDownload(doc)}
        onView={(doc) => void handleView(doc)}
        onDelete={setDeleting}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        closeOnConfirm={false}
        confirmPending={remove.isPending}
        title={t("villaDocuments.deleteTitle")}
        message={t("villaDocuments.deleteBody", {
          name: deleting?.originalName ?? "",
        })}
      />
    </div>
  )
}
