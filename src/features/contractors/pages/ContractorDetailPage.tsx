import { useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import PhoneDisplay from "@/shared/ui/PhoneDisplay"
import Button from "@/shared/ui/Button"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import { ConfirmModal } from "@/shared/ui/Modal"
import { DetailField, DetailFieldGrid } from "@/shared/ui/detail-fields"
import { formatDateTime } from "@/shared/lib/format"
import { EntityDetailSkeleton } from "@/shared/ui/loading-skeletons"
import { useContractorQuery, useDeleteContractorMutation } from "../api"
import DirectoryEmailDisplay from "@/shared/directory/DirectoryEmailDisplay"
import type { Contractor } from "../api"
import ContractorFormModal from "../components/ContractorFormModal"
import ContractorsListErrorBanner from "../components/ContractorsListErrorBanner"

export default function ContractorDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const listSearch =
    (location.state as { listSearch?: string } | null)?.listSearch ?? ""
  const backTo = `/contractors${listSearch}`
  const { can } = usePermissions()
  const {
    data: contractor,
    isLoading,
    isError,
    error,
    refetch,
  } = useContractorQuery(id)
  const remove = useDeleteContractorMutation()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const canUpdate = can("contractors:update")
  const canDelete = can("contractors:delete")
  const canSummary = can("contractors:summary")
  const canAudit = can("audit:read")

  if (isLoading) {
    return <EntityDetailSkeleton actionCount={3} fields={5} />
  }

  if (isError || !contractor) {
    const apiErr = error ? toApiError(error) : null
    const notFound =
      apiErr?.code === "CONTRACTOR_NOT_FOUND" || apiErr?.status === 404
    return (
      <Card className="mx-auto mt-12 max-w-lg p-8 text-center">
        <h1 className="text-lg font-semibold">
          {notFound
            ? t("contractors.notFoundTitle")
            : t("contractors.errorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {notFound ? t("contractors.notFoundBody") : apiErr?.message}
        </p>
        <ContractorsListErrorBanner
          error={apiErr}
          onRetry={() => void refetch()}
        />
        <Link
          to={backTo}
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          {t("contractors.backToList")}
        </Link>
      </Card>
    )
  }

  const deleteBlocked = contractor.villaCount > 0

  const handleDelete = async (target: Contractor) => {
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
      if (parsed.code === "CONTRACTOR_NOT_FOUND" || parsed.status === 404) {
        setNotice(t("contractors.deleteAlreadyGone"))
        setDeleting(false)
        return
      }
      if (parsed.code === "CONTRACTOR_HAS_VILLAS") {
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
          {t("contractors.backToList")}
        </Link>
      </div>
      {notice && (
        <p role="status" className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm">
          {notice}
        </p>
      )}
      <PageHeader
        title={contractor.name}
        actions={
          <div className="flex flex-wrap gap-2">
            {canSummary && (
              <Link to={`/contractors/${contractor.id}/summary`}>
                <Button type="button" icon="folder">
                  {t("contractors.viewSummary")}
                </Button>
              </Link>
            )}
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
                    ? t("contractors.deleteBlockedProjects", {
                        count: contractor.villaCount,
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
          <DetailField boxed label={t("contractors.name")}>
            <span dir="auto" className="font-medium">
              {contractor.name}
            </span>
          </DetailField>
          <DetailField boxed label={t("contractors.phone")}>
            <div dir="ltr" className="isolate text-start">
              <PhoneDisplay phone={contractor.phone} />
            </div>
          </DetailField>
          <DetailField boxed label={t("directory.email")}>
            <DirectoryEmailDisplay value={contractor.email} />
          </DetailField>
          <DetailField boxed label={t("contractors.villaCount")}>
            <span className="tabular-nums">
              {can("villas:read") ? (
                <Link
                  to={`/villas?contractorId=${contractor.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {contractor.villaCount}
                </Link>
              ) : (
                contractor.villaCount
              )}
            </span>
          </DetailField>
          <DetailField boxed label={t("contractors.createdAt")}>
            <time
              className="tabular-nums text-muted-foreground"
              dateTime={contractor.createdAt}
            >
              {formatDateTime(contractor.createdAt)}
            </time>
          </DetailField>
          <DetailField boxed label={t("contractors.updatedAt")}>
            <time
              className="tabular-nums text-muted-foreground"
              dateTime={contractor.updatedAt}
            >
              {formatDateTime(contractor.updatedAt)}
            </time>
          </DetailField>
        </DetailFieldGrid>
        {canAudit && (
          <div className="mt-5 border-t border-border pt-4 text-start">
            <Link
              to={`/audit?entity=Contractor&entityId=${contractor.id}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              {t("contractors.viewHistory")}
            </Link>
          </div>
        )}
      </Card>
      <ContractorFormModal
        open={editOpen}
        contractorId={contractor.id}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
        onDeletedWhileEditing={() => {
          setNotice(t("contractors.editDeleted"))
        }}
      />
      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => void handleDelete(contractor)}
        closeOnConfirm={false}
        title={t("contractors.deleteTitle")}
        message={t("contractors.deleteBody", {
          name: contractor.name,
          phone: contractor.phone,
        })}
      />
    </>
  )
}
