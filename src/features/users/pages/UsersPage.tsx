import { useEffect, useId, useMemo, useState } from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { useMeQuery, usePermissions } from "@/features/auth/api"
import Button, { IconButton } from "@/shared/ui/Button"
import DataTable, { RowActions } from "@/shared/ui/DataTable"
import { SearchInput } from "@/shared/ui/Field"
import { FilterSelect } from "@/shared/ui/filter-select"
import { Label } from "@/shared/ui/label"
import Icon from "@/shared/ui/Icon"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import { Badge } from "@/shared/ui/Badge"
import { formatDateTime } from "@/shared/lib/format"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import {
  useActivateUserMutation,
  useDeactivateUserMutation,
  useDeleteUserMutation,
  useUserQuery,
  useUsersListParams,
  useUsersListQuery,
} from "../api"
import type { UserListItem } from "../types"
import CreateUserModal from "../components/CreateUserModal"
import EditUserModal from "../components/EditUserModal"
import ResetUserPasswordDialog from "../components/ResetUserPasswordDialog"
import { userActionRules } from "../lib/userRules"

const col = createColumnHelper<UserListItem>()
const ROLES = ["ADMIN", "EMPLOYEE"] as const
const filterFieldClass = "min-w-0 w-full"
const filterTriggerClass = "h-9 w-full max-w-none bg-card"

function SortHeader({
  label,
  field,
  sort,
  onSort,
}: {
  label: string
  field: string
  sort?: string
  onSort: (field: string) => void
}) {
  const [curField, curDir] = (sort ?? "").split(":")
  const active = curField === field
  const dir = active ? curDir : undefined
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto px-0 py-0 font-medium hover:bg-transparent"
      onClick={() => onSort(field)}
      aria-sort={
        dir === "desc" ? "descending" : dir === "asc" ? "ascending" : "none"
      }
    >
      {label}
      <Icon
        name={dir === "desc" ? "sortDesc" : dir === "asc" ? "sortAsc" : "sort"}
        size={14}
      />
    </Button>
  )
}

export default function UsersPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { data: me } = useMeQuery()
  const { params, setParam, setPage, setLimit, toggleSort } =
    useUsersListParams()
  const { data, isLoading, isError, error, refetch } = useUsersListQuery()
  const deactivateUser = useDeactivateUserMutation()
  const deleteUser = useDeleteUserMutation()
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null)
  const activateUser = useActivateUserMutation()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toggleTarget, setToggleTarget] = useState<UserListItem | null>(null)
  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null)
  const [searchDraft, setSearchDraft] = useState(params.search ?? "")

  useEffect(() => {
    setSearchDraft(params.search ?? "")
  }, [params.search])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = searchDraft.trim()
      const current = params.search ?? ""
      if (next !== current) setParam("search", next || undefined)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchDraft, params.search, setParam])

  const rows = data?.data ?? []
  const meta = data?.meta
  const listError = isError ? toApiError(error).message : null
  const { data: editUser } = useUserQuery(editId ?? undefined)

  const canCreate = can("users:create")
  const canUpdate = can("users:update")
  const canDeactivate = can("users:deactivate")
  const canDelete = can("users:delete")

  const columns = useMemo(
    () => [
      col.accessor("name", {
        header: () => (
          <SortHeader
            label={t("users.name")}
            field="name"
            sort={params.sort}
            onSort={toggleSort}
          />
        ),
        cell: (c) => (
          <Link
            to={`/users/${c.row.original.id}`}
            className="flex items-center gap-3 hover:underline"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {c.getValue().trim()[0]}
            </span>
            <div>
              <p className="font-medium">{c.getValue()}</p>
              <p dir="ltr" className="text-start text-xs text-muted-foreground">
                {c.row.original.email}
              </p>
            </div>
          </Link>
        ),
      }),
      col.accessor("role", {
        header: t("users.role"),
        cell: (c) => (
          <Badge tone={c.getValue() === "ADMIN" ? "info" : "neutral"}>
            {t(`roles.${c.getValue()}`)}
          </Badge>
        ),
      }),
      col.accessor("isActive", {
        header: t("users.status"),
        cell: (c) => (
          <Badge tone={c.getValue() ? "success" : "danger"}>
            {c.getValue() ? t("users.active") : t("users.disabled")}
          </Badge>
        ),
      }),
      col.accessor("createdAt", {
        header: () => (
          <SortHeader
            label={t("users.createdAt")}
            field="createdAt"
            sort={params.sort}
            onSort={toggleSort}
          />
        ),
        cell: (c) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatDateTime(c.getValue())}
          </span>
        ),
      }),
      ...(canUpdate || canDeactivate || canDelete
        ? [
            col.display({
              id: "actions",
              header: () => (
                <span className="sr-only">{t("common.actions")}</span>
              ),
              cell: (c) => {
                const u = c.row.original
                const rules = userActionRules(u, me)
                const editDisabled = !canUpdate || !rules.canEditProfile
                const editTitle = editDisabled
                  ? !canUpdate
                    ? t("users.noPermission")
                    : t("users.adminEditRestricted")
                  : t("common.edit")
                const resetDisabled = !canUpdate || !rules.canResetPassword
                const resetTitle = resetDisabled
                  ? !canUpdate
                    ? t("users.noPermission")
                    : t("users.adminResetRestricted")
                  : t("users.resetPasswordAction")
                const toggleDisabled = !canDeactivate || !rules.canDeactivate
                const toggleTitle = toggleDisabled
                  ? !canDeactivate
                    ? t("users.noPermission")
                    : rules.isSelf
                      ? t("users.cannotDeactivateSelf")
                      : t("users.cannotDeactivateAdmin")
                  : u.isActive
                    ? t("users.deactivateAction")
                    : t("users.activateAction")
                return (
                  <RowActions>
                    {canUpdate && (
                      <IconButton
                        icon="edit"
                        label={editTitle}
                        disabled={editDisabled}
                        title={editTitle}
                        onClick={() => setEditId(u.id)}
                      />
                    )}
                    {canUpdate && (
                      <IconButton
                        icon="key"
                        label={resetTitle}
                        disabled={resetDisabled}
                        title={resetTitle}
                        onClick={() => setResetTarget(u)}
                      />
                    )}
                    {canDeactivate && (
                      <IconButton
                        icon={u.isActive ? "x" : "check"}
                        label={toggleTitle}
                        disabled={toggleDisabled && u.isActive}
                        title={toggleTitle}
                        variant={u.isActive ? "danger" : "success"}
                        onClick={() => setToggleTarget(u)}
                      />
                    )}
                    {canDelete && (
                      <IconButton
                        icon="trash"
                        label={
                          rules.canDelete
                            ? t("users.deleteAction")
                            : rules.isSelf
                              ? t("users.cannotDeleteSelf")
                              : t("users.cannotDeleteAdmin")
                        }
                        title={
                          rules.canDelete
                            ? t("users.deleteAction")
                            : rules.isSelf
                              ? t("users.cannotDeleteSelf")
                              : t("users.cannotDeleteAdmin")
                        }
                        disabled={!rules.canDelete}
                        variant="danger"
                        onClick={() => setDeleteTarget(u)}
                      />
                    )}
                  </RowActions>
                )
              },
            }),
          ]
        : []),
    ],
    [t, params.sort, toggleSort, canUpdate, canDeactivate, canDelete, me],
  )

  const isActiveFilter =
    params.isActive === undefined ? "" : params.isActive ? "true" : "false"
  const searchFieldId = useId()

  return (
    <>
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        actions={
          canCreate ? (
            <ListPageHeaderActions
              showImport={false}
              add={{
                label: t("users.createAction"),
                onClick: () => setCreateOpen(true),
              }}
            />
          ) : undefined
        }
      />
      <section
        className="mb-4 rounded-lg border border-border bg-card/40 p-4"
        aria-label={t("users.filtersSection")}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <Label
              htmlFor={searchFieldId}
              className="text-xs font-normal text-muted-foreground"
            >
              {t("common.search")}
            </Label>
            <SearchInput
              id={searchFieldId}
              value={searchDraft}
              onChange={setSearchDraft}
              placeholder={t("common.search")}
            />
          </div>
          <FilterSelect
            className={filterFieldClass}
            triggerClassName={filterTriggerClass}
            label={t("users.role")}
            value={params.role ?? ""}
            onChange={(v) => setParam("role", v || undefined)}
            options={ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
          />
          <FilterSelect
            className={filterFieldClass}
            triggerClassName={filterTriggerClass}
            label={t("users.status")}
            value={isActiveFilter}
            onChange={(v) => {
              if (v === "true") setParam("isActive", "true")
              else if (v === "false") setParam("isActive", "false")
              else setParam("isActive", undefined)
            }}
            options={[
              { value: "true", label: t("users.active") },
              { value: "false", label: t("users.disabled") },
            ]}
          />
        </div>
      </section>
      <DataTable
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={listError}
        onRetry={() => void refetch()}
        pageSizeOptions={[10, 20, 50, 100]}
        pagination={
          meta
            ? {
                pageIndex: meta.page - 1,
                pageSize: meta.limit,
                pageCount: meta.totalPages,
                total: meta.total,
                onPageChange: (pageIndex) => setPage(pageIndex + 1),
                onPageSizeChange: setLimit,
              }
            : undefined
        }
        emptyTitle={t("users.emptyTitle")}
        emptyBody={t("users.emptyBody")}
        errorTitle={t("users.errorTitle")}
        errorBody={t("users.errorBody")}
      />
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserModal user={editUser ?? null} onClose={() => setEditId(null)} />
      <ConfirmModal
        open={!!toggleTarget && toggleTarget.isActive}
        onClose={() => setToggleTarget(null)}
        title={t("users.deactivateTitle")}
        message={t("users.deactivateBody", { name: toggleTarget?.name ?? "" })}
        confirmLabel={t("users.deactivateAction")}
        onConfirm={() => {
          if (toggleTarget) {
            deactivateUser.mutate({
              id: toggleTarget.id,
              write: { ifMatch: toggleTarget.version },
            })
          }
          setToggleTarget(null)
        }}
      />
      {toggleTarget && !toggleTarget.isActive && (
        <ConfirmModal
          open
          onClose={() => setToggleTarget(null)}
          title={t("users.activateTitle")}
          message={t("users.activateBody", { name: toggleTarget.name })}
          confirmLabel={t("users.activateAction")}
          confirmVariant="primary"
          onConfirm={() => {
            activateUser.mutate({
              id: toggleTarget.id,
              write: { ifMatch: toggleTarget.version },
            })
            setToggleTarget(null)
          }}
        />
      )}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("users.deleteTitle")}
        message={t("users.deleteBody", { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("users.deleteAction")}
        confirmPending={deleteUser.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteUser.mutateAsync({
              id: deleteTarget.id,
              version: deleteTarget.version,
            })
            toast.success(t("users.deleted", { name: deleteTarget.name }))
          } catch (err) {
            // USER_HAS_RECORDS says to deactivate the user instead.
            toast.error(toApiError(err).message)
          } finally {
            setDeleteTarget(null)
          }
        }}
      />
      <ResetUserPasswordDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        target={resetTarget}
        me={me}
      />
    </>
  )
}
