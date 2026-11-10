import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import Button from "@/shared/ui/Button"
import { ConfirmModal } from "@/shared/ui/Modal"
import {
  usePermissionCatalogQuery,
  useReplaceUserPermissionsMutation,
  useUserPermissionsQuery,
} from "@/features/permissions/api"
import { PermissionAssignGroups } from "@/features/permissions/components/PermissionAssignGroups"
import { PermissionCatalogLoading } from "@/features/permissions/components/PermissionCatalogLoading"
import { permissionDiff } from "../lib/permissionLabel"
import ApiErrorBanner from "./ApiErrorBanner"

export default function UserPermissionsEditor({
  userId,
  userName,
  readOnly,
  readOnlyReason,
}: {
  userId: string
  userName: string
  readOnly: boolean
  readOnlyReason?: string
}) {
  const { t } = useTranslation()
  const { data: catalog, isLoading: catalogLoading } =
    usePermissionCatalogQuery()
  const { data: assigned, isLoading: assignedLoading } =
    useUserPermissionsQuery(userId)
  const replace = useReplaceUserPermissionsMutation(userId)
  const [draft, setDraft] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [apiError, setApiError] =
    useState<ReturnType<typeof toApiError> | null>(null)

  useEffect(() => {
    if (assigned) setDraft(assigned.permissions)
  }, [assigned])

  const baseline = assigned?.permissions ?? []
  const dirty = useMemo(() => {
    if (baseline.length !== draft.length) return true
    const set = new Set(baseline)
    return draft.some((c) => !set.has(c))
  }, [baseline, draft])

  const diff = useMemo(() => permissionDiff(baseline, draft), [baseline, draft])

  const toggle = (code: string) => {
    setDraft((cur) =>
      cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code],
    )
  }

  const toggleGroup = (codes: string[], on: boolean) => {
    setDraft((cur) => {
      const set = new Set(cur)
      for (const c of codes) {
        if (on) set.add(c)
        else set.delete(c)
      }
      return [...set].sort()
    })
  }

  const save = async () => {
    setApiError(null)
    try {
      await replace.mutateAsync(draft)
      setConfirmOpen(false)
    } catch (err) {
      setApiError(toApiError(err))
      setConfirmOpen(false)
    }
  }

  if (catalogLoading || assignedLoading) {
    return <PermissionCatalogLoading groups={2} rows={3} />
  }

  return (
    <>
      <ApiErrorBanner error={apiError} />
      {readOnly && readOnlyReason && (
        <p className="mb-3 text-sm text-muted-foreground" role="status">
          {readOnlyReason}
        </p>
      )}
      {catalog && (
        <PermissionAssignGroups
          catalog={catalog}
          selected={draft}
          onToggle={toggle}
          onToggleGroup={readOnly ? undefined : toggleGroup}
          readOnly={readOnly}
          variant="editor"
        />
      )}
      {!readOnly && (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="primary"
            disabled={!dirty || replace.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {t("permissions.savePermissions")}
          </Button>
        </div>
      )}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => save()}
        closeOnConfirm={false}
        confirmVariant="primary"
        title={t("permissions.confirmTitle")}
        message={t("permissions.confirmBody", { name: userName })}
        confirmLabel={t("permissions.confirmAction")}
      >
        <div className="mt-3 space-y-2 text-start text-sm">
          {diff.added.length > 0 && (
            <div>
              <p className="font-medium text-closed">
                {t("permissions.added")}
              </p>
              <ul className="list-inside list-disc font-mono text-xs">
                {diff.added.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {diff.removed.length > 0 && (
            <div>
              <p className="font-medium text-danger">
                {t("permissions.removed")}
              </p>
              <ul className="list-inside list-disc font-mono text-xs">
                {diff.removed.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ConfirmModal>
    </>
  )
}
