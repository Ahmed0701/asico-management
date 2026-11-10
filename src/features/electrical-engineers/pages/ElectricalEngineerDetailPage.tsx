import { useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import Button from "@/shared/ui/Button"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import { ConfirmModal } from "@/shared/ui/Modal"
import { DetailField, DetailFieldGrid } from "@/shared/ui/detail-fields"
import { formatDateTime } from "@/shared/lib/format"
import PhoneDisplay from "@/shared/ui/PhoneDisplay"
import { EntityDetailSkeleton } from "@/shared/ui/loading-skeletons"
import {
  useDeleteElectricalEngineerMutation,
  useElectricalEngineerQuery,
} from "../api"
import DirectoryEmailDisplay from "@/shared/directory/DirectoryEmailDisplay"
import type { ElectricalEngineer } from "../api"
import ElectricalEngineerFormModal from "../components/ElectricalEngineerFormModal"
import ElectricalEngineersListErrorBanner from "../components/ElectricalEngineersListErrorBanner"

export default function ElectricalEngineerDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const listSearch =
    (location.state as { listSearch?: string } | null)?.listSearch ?? ""
  const backTo = `/electrical-engineers${listSearch}`
  const { can } = usePermissions()
  const {
    data: engineer,
    isLoading,
    isError,
    error,
    refetch,
  } = useElectricalEngineerQuery(id)
  const remove = useDeleteElectricalEngineerMutation()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const canUpdate = can("electrical-engineers:update")
  const canDelete = can("electrical-engineers:delete")
  const canAudit = can("audit:read")

  if (isLoading) {
    return <EntityDetailSkeleton actionCount={2} fields={5} />
  }

  if (isError || !engineer) {
    const apiErr = error ? toApiError(error) : null
    const notFound =
      apiErr?.code === "ELECTRICAL_ENGINEER_NOT_FOUND" || apiErr?.status === 404
    return (
      <Card className="mx-auto mt-12 max-w-lg p-8 text-center">
        <h1 className="text-lg font-semibold">
          {notFound
            ? t("electricalEngineers.notFoundTitle")
            : t("electricalEngineers.errorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {notFound ? t("electricalEngineers.notFoundBody") : apiErr?.message}
        </p>
        <ElectricalEngineersListErrorBanner
          error={apiErr}
          onRetry={() => void refetch()}
        />
        <Link
          to={backTo}
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          {t("electricalEngineers.backToList")}
        </Link>
      </Card>
    )
  }

  const deleteBlocked = engineer.villaCount > 0

  const handleDelete = async (target: ElectricalEngineer) => {
    setNotice(null)
    try {
      await remove.mutateAsync({
        id: target.id,
        write: { ifMatch: target.version },
      })
      setDeleting(false)
      navigate(backTo, { replace: true })
    } catch (err) {
      const parsed = toApiError(err)
      if (
        parsed.code === "ELECTRICAL_ENGINEER_NOT_FOUND" ||
        parsed.status === 404
      ) {
        setNotice(t("electricalEngineers.deleteAlreadyGone"))
        setDeleting(false)
        return
      }
      if (parsed.code === "ELECTRICAL_ENGINEER_IN_USE") {
        setNotice(parsed.message)
        setDeleting(false)
        void refetch()
        return
      }
      setNotice(parsed.message)
    }
  }

  return (
    <>
      <div className="mb-4">
        <Link to={backTo} className="text-sm text-accent hover:underline">
          {t("electricalEngineers.backToList")}
        </Link>
      </div>
      {notice && (
        <p role="status" className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm">
          {notice}
        </p>
      )}
      <PageHeader
        title={engineer.name}
        actions={
          <div className="flex flex-wrap gap-2">
            {canUpdate && (
              <Button icon="edit" onClick={() => setEditOpen(true)}>
                {t("common.edit")}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                icon="trash"
                disabled={deleteBlocked}
                title={
                  deleteBlocked
                    ? t("electricalEngineers.deleteBlockedProjects", {
                        count: engineer.villaCount,
                      })
                    : undefined
                }
                onClick={() => setDeleting(true)}
              >
                {t("common.delete")}
              </Button>
            )}
          </div>
        }
      />
      <Card className="p-4 sm:p-5">
        <DetailFieldGrid columns="two">
          <DetailField boxed label={t("electricalEngineers.name")}>
            <span dir="auto" className="font-medium">
              {engineer.name}
            </span>
          </DetailField>
          <DetailField boxed label={t("electricalEngineers.phone")}>
            <div dir="ltr" className="isolate text-start">
              <PhoneDisplay phone={engineer.phone} />
            </div>
          </DetailField>
          <DetailField boxed label={t("directory.email")}>
            <DirectoryEmailDisplay value={engineer.email} />
          </DetailField>
          <DetailField boxed label={t("electricalEngineers.villaCount")}>
            <span className="tabular-nums">
              {can("villas:read") ? (
                <Link
                  to={`/villas?electricalEngineerId=${engineer.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {engineer.villaCount}
                </Link>
              ) : (
                engineer.villaCount
              )}
            </span>
          </DetailField>
          <DetailField boxed label={t("electricalEngineers.createdAt")}>
            <time
              className="tabular-nums text-muted-foreground"
              dateTime={engineer.createdAt}
            >
              {formatDateTime(engineer.createdAt)}
            </time>
          </DetailField>
          <DetailField boxed label={t("electricalEngineers.updatedAt")}>
            <time
              className="tabular-nums text-muted-foreground"
              dateTime={engineer.updatedAt}
            >
              {formatDateTime(engineer.updatedAt)}
            </time>
          </DetailField>
        </DetailFieldGrid>
        {canAudit && (
          <div className="mt-5 border-t border-border pt-4 text-start">
            <Link
              to={`/audit?entity=ElectricalEngineer&entityId=${engineer.id}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              {t("electricalEngineers.viewHistory")}
            </Link>
          </div>
        )}
      </Card>
      <ElectricalEngineerFormModal
        open={editOpen}
        engineerId={engineer.id}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
        onDeletedWhileEditing={() => {
          setNotice(t("electricalEngineers.editDeleted"))
        }}
      />
      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => void handleDelete(engineer)}
        closeOnConfirm={false}
        title={t("electricalEngineers.deleteTitle")}
        message={t("electricalEngineers.deleteBody", {
          name: engineer.name,
          phone: engineer.phone,
        })}
      />
    </>
  )
}
