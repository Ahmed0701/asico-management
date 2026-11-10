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
import { useDeleteEngineerMutation, useEngineerQuery } from "../api"
import DirectoryEmailDisplay from "@/shared/directory/DirectoryEmailDisplay"
import type { CivilEngineer } from "../api"
import EngineerFormModal from "../components/EngineerFormModal"
import EngineersListErrorBanner from "../components/EngineersListErrorBanner"

export default function EngineerDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const listSearch =
    (location.state as { listSearch?: string } | null)?.listSearch ?? ""
  const backTo = `/civil-engineers${listSearch}`
  const { can } = usePermissions()
  const {
    data: engineer,
    isLoading,
    isError,
    error,
    refetch,
  } = useEngineerQuery(id)
  const remove = useDeleteEngineerMutation()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const canUpdate = can("civil-engineers:update")
  const canDelete = can("civil-engineers:delete")
  const canAudit = can("audit:read")

  if (isLoading) {
    return <EntityDetailSkeleton actionCount={2} fields={5} />
  }

  if (isError || !engineer) {
    const apiErr = error ? toApiError(error) : null
    const notFound =
      apiErr?.code === "CIVIL_ENGINEER_NOT_FOUND" || apiErr?.status === 404
    return (
      <Card className="mx-auto mt-12 max-w-lg p-8 text-center">
        <h1 className="text-lg font-semibold">
          {notFound ? t("engineers.notFoundTitle") : t("engineers.errorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {notFound ? t("engineers.notFoundBody") : apiErr?.message}
        </p>
        <EngineersListErrorBanner
          error={apiErr}
          onRetry={() => void refetch()}
        />
        <Link
          to={backTo}
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          {t("engineers.backToList")}
        </Link>
      </Card>
    )
  }

  const deleteBlocked = engineer.villaCount > 0

  const handleDelete = async (target: CivilEngineer) => {
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
      if (parsed.code === "CIVIL_ENGINEER_NOT_FOUND" || parsed.status === 404) {
        setNotice(t("engineers.deleteAlreadyGone"))
        setDeleting(false)
        return
      }
      if (parsed.code === "CIVIL_ENGINEER_HAS_VILLAS") {
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
          {t("engineers.backToList")}
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
                    ? t("engineers.deleteBlockedProjects", {
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
          <DetailField boxed label={t("engineers.name")}>
            <span dir="auto" className="font-medium">
              {engineer.name}
            </span>
          </DetailField>
          <DetailField boxed label={t("engineers.phone")}>
            <div dir="ltr" className="isolate text-start">
              <PhoneDisplay phone={engineer.phone} />
            </div>
          </DetailField>
          <DetailField boxed label={t("directory.email")}>
            <DirectoryEmailDisplay value={engineer.email} />
          </DetailField>
          <DetailField boxed label={t("engineers.villaCount")}>
            <span className="tabular-nums">
              {can("villas:read") ? (
                <Link
                  to={`/villas?civilEngineerId=${engineer.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {engineer.villaCount}
                </Link>
              ) : (
                engineer.villaCount
              )}
            </span>
          </DetailField>
          <DetailField boxed label={t("engineers.createdAt")}>
            <time
              className="tabular-nums text-muted-foreground"
              dateTime={engineer.createdAt}
            >
              {formatDateTime(engineer.createdAt)}
            </time>
          </DetailField>
          <DetailField boxed label={t("engineers.updatedAt")}>
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
              to={`/audit?entity=CivilEngineer&entityId=${engineer.id}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              {t("engineers.viewHistory")}
            </Link>
          </div>
        )}
      </Card>
      <EngineerFormModal
        open={editOpen}
        engineerId={engineer.id}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
        onDeletedWhileEditing={() => {
          setNotice(t("engineers.editDeleted"))
        }}
      />
      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => void handleDelete(engineer)}
        closeOnConfirm={false}
        title={t("engineers.deleteTitle")}
        message={t("engineers.deleteBody", {
          name: engineer.name,
          phone: engineer.phone,
        })}
      />
    </>
  )
}
