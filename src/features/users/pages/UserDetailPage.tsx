import { useState } from "react"
import { Link, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useMeQuery, usePermissions } from "@/features/auth/api"
import Button from "@/shared/ui/Button"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import { Badge } from "@/shared/ui/Badge"
import { formatDateTime } from "@/shared/lib/format"
import { toApiError } from "@/shared/api/errors"
import {
  useActivateUserMutation,
  useDeactivateUserMutation,
  useUserQuery,
} from "../api"
import ApiErrorBanner from "../components/ApiErrorBanner"
import EditUserModal from "../components/EditUserModal"
import ResetUserPasswordDialog from "../components/ResetUserPasswordDialog"
import UserPermissionsEditor from "../components/UserPermissionsEditor"
import { userActionRules } from "../lib/userRules"
import { ConfirmModal } from "@/shared/ui/Modal"
import Tabs from "@/shared/ui/Tabs"
import { EntityDetailSkeleton } from "@/shared/ui/loading-skeletons"

type Tab = "overview" | "permissions"

export default function UserDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { can } = usePermissions()
  const { data: me } = useMeQuery()
  const { data: user, isLoading, isError, error, refetch } = useUserQuery(id)
  const activate = useActivateUserMutation()
  const deactivate = useDeactivateUserMutation()
  const [tab, setTab] = useState<Tab>("overview")
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [actionError, setActionError] =
    useState<ReturnType<typeof toApiError> | null>(null)

  const canUpdate = can("users:update")
  const canDeactivate = can("users:deactivate")
  const canAssign = can("permissions:assign")
  const canAudit = can("audit:read")

  if (isLoading) {
    return <EntityDetailSkeleton tabs actionCount={2} fields={4} />
  }

  if (isError || !user) {
    const apiErr = error ? toApiError(error) : null
    return (
      <>
        <Link to="/users" className="text-sm text-accent hover:underline">
          {t("users.backToList")}
        </Link>
        <ApiErrorBanner error={apiErr} />
        <Button onClick={() => void refetch()}>{t("common.retry")}</Button>
      </>
    )
  }

  const rules = userActionRules(user, me)
  const editDisabled = !canUpdate || !rules.canEditProfile
  const editReason = !canUpdate
    ? t("users.noPermission")
    : !rules.canEditProfile
      ? t("users.adminEditRestricted")
      : undefined

  const resetDisabled = !canUpdate || !rules.canResetPassword
  const resetReason = !canUpdate
    ? t("users.noPermission")
    : !rules.canResetPassword
      ? t("users.adminResetRestricted")
      : undefined

  const deactivateDisabled = !canDeactivate || !rules.canDeactivate
  const deactivateReason = !canDeactivate
    ? t("users.noPermission")
    : rules.isSelf
      ? t("users.cannotDeactivateSelf")
      : rules.isTargetAdmin
        ? t("users.cannotDeactivateAdmin")
        : undefined

  const permReadOnly =
    !canAssign || !rules.canEditPermissions || user.role === "ADMIN"
  const permReason = !canAssign
    ? t("users.noPermission")
    : user.role === "ADMIN"
      ? t("users.adminPermissionsImplied")
      : rules.isSelf
        ? t("users.cannotEditOwnPermissions")
        : undefined

  return (
    <>
      <div className="mb-4">
        <Link to="/users" className="text-sm text-accent hover:underline">
          {t("users.backToList")}
        </Link>
      </div>
      <PageHeader
        title={user.name}
        subtitle={user.email}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              icon="edit"
              disabled={editDisabled}
              title={editDisabled ? editReason : undefined}
              onClick={() => setEditOpen(true)}
            >
              {t("common.edit")}
            </Button>
            {canUpdate && (
              <Button
                icon="key"
                disabled={resetDisabled}
                title={resetDisabled ? resetReason : undefined}
                onClick={() => setResetOpen(true)}
              >
                {t("users.resetPasswordAction")}
              </Button>
            )}
            {user.isActive ? (
              <Button
                variant="danger"
                icon="trash"
                disabled={deactivateDisabled}
                title={deactivateDisabled ? deactivateReason : undefined}
                onClick={() => setDeactivateOpen(true)}
              >
                {t("users.deactivateAction")}
              </Button>
            ) : (
              <Button
                disabled={!canDeactivate}
                title={!canDeactivate ? t("users.noPermission") : undefined}
                onClick={async () => {
                  setActionError(null)
                  try {
                    await activate.mutateAsync({
                      id: user.id,
                      write: { ifMatch: user.version },
                    })
                  } catch (err) {
                    setActionError(toApiError(err))
                  }
                }}
              >
                {t("users.activateAction")}
              </Button>
            )}
          </div>
        }
      />
      <ApiErrorBanner error={actionError} />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: t("users.tabOverview") },
          { id: "permissions", label: t("users.tabPermissions") },
        ]}
      />
      {tab === "overview" && (
        <Card className="p-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("users.role")}</dt>
              <dd>
                <Badge tone={user.role === "ADMIN" ? "info" : "neutral"}>
                  {t(`roles.${user.role}`)}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("users.status")}</dt>
              <dd>
                <Badge tone={user.isActive ? "success" : "danger"}>
                  {user.isActive ? t("users.active") : t("users.disabled")}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("users.createdAt")}</dt>
              <dd className="tabular-nums">{formatDateTime(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("users.permissionCountLabel")}
              </dt>
              <dd className="tabular-nums">
                {user.role === "ADMIN"
                  ? t("users.adminPermissionsImplied")
                  : t("users.permissionCount", {
                      count: user.permissions.length,
                    })}
              </dd>
            </div>
          </dl>
          {canAudit && (
            <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
              <Link
                to={`/audit?entity=User&entityId=${user.id}`}
                className="text-sm font-medium text-accent hover:underline"
              >
                {t("users.viewActivity")}
              </Link>
              <Link
                to={`/audit?actorId=${user.id}`}
                className="text-sm font-medium text-accent hover:underline"
              >
                {t("users.viewActionsByUser")}
              </Link>
            </div>
          )}
        </Card>
      )}
      {tab === "permissions" && (
        <UserPermissionsEditor
          userId={user.id}
          userName={user.name}
          readOnly={permReadOnly}
          readOnlyReason={permReason}
        />
      )}
      <EditUserModal
        user={editOpen ? user : null}
        onClose={() => setEditOpen(false)}
      />
      <ConfirmModal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title={t("users.deactivateTitle")}
        message={t("users.deactivateBody", { name: user.name })}
        confirmLabel={t("users.deactivateAction")}
        onConfirm={async () => {
          setActionError(null)
          try {
            await deactivate.mutateAsync({
              id: user.id,
              write: { ifMatch: user.version },
            })
          } catch (err) {
            setActionError(toApiError(err))
          }
        }}
      />
      <ResetUserPasswordDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        target={user}
        me={me}
      />
    </>
  )
}
