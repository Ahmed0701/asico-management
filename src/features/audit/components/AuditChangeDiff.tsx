import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import { cn } from "@/shared/lib/cn"
import {
  diffAuditSnapshots,
  flattenVisibleChanges,
  formatDiffValue,
  isRedacted,
  type DiffChange,
} from "../lib/auditDiff"

function ValueDisplay({ value }: { value: unknown }) {
  const { t } = useTranslation()
  if (isRedacted(value)) {
    return (
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
        {t("audit.diffHidden")}
      </span>
    )
  }
  return (
    <span dir="ltr" className="font-mono text-xs break-all">
      {formatDiffValue(value)}
    </span>
  )
}

function ChangeRow({ change }: { change: DiffChange }) {
  const { t } = useTranslation()
  if (change.kind === "created") {
    return <p className="text-sm text-closed">{t("audit.diffCreated")}</p>
  }
  if (change.kind === "removed") {
    return <p className="text-sm text-danger">{t("audit.diffRemovedRecord")}</p>
  }
  if (change.kind === "none") {
    return (
      <p className="text-sm text-muted-foreground">{t("audit.noChanges")}</p>
    )
  }
  if (change.kind === "stringArray") {
    return (
      <div className="overflow-hidden rounded-lg border border-border text-sm">
        <div className="border-b border-border bg-muted/40 px-3 py-2 text-start">
          <code className="text-xs font-medium" dir="ltr">
            {change.path}
          </code>
        </div>
        <div className="grid gap-4 p-3 sm:grid-cols-2">
          {change.added.length > 0 && (
            <div className="min-w-0 rounded-md bg-closed-soft/40 p-3 text-start">
              <p className="text-xs font-medium text-closed">
                {t("audit.diffAdded")}
              </p>
              <ul
                className="mt-2 list-inside list-disc space-y-0.5 font-mono text-xs"
                dir="ltr"
              >
                {change.added.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          {change.removed.length > 0 && (
            <div className="min-w-0 rounded-md bg-danger-soft/50 p-3 text-start">
              <p className="text-xs font-medium text-danger">
                {t("audit.diffRemoved")}
              </p>
              <ul
                className="mt-2 list-inside list-disc space-y-0.5 font-mono text-xs"
                dir="ltr"
              >
                {change.removed.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }
  if (change.kind === "scalar") {
    return (
      <div className="overflow-hidden rounded-lg border border-border text-sm">
        <div className="border-b border-border bg-muted/40 px-3 py-2 text-start">
          <code className="text-xs font-medium" dir="ltr">
            {change.path}
          </code>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
          <div className="min-w-0 p-3 text-start">
            <p className="text-xs font-medium text-muted-foreground">
              {t("audit.before")}
            </p>
            <div className="mt-2 rounded-md bg-muted/30 px-2.5 py-2">
              <ValueDisplay value={change.before} />
            </div>
          </div>
          <div className="min-w-0 p-3 text-start">
            <p className="text-xs font-medium text-muted-foreground">
              {t("audit.after")}
            </p>
            <div className="mt-2 rounded-md bg-muted/30 px-2.5 py-2">
              <ValueDisplay value={change.after} />
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function AuditChangeDiff({
  before,
  after,
}: {
  before: unknown
  after: unknown
}) {
  const { t } = useTranslation()
  const [showFull, setShowFull] = useState(false)
  const [showRaw, setShowRaw] = useState(false)

  const changes = useMemo(
    () => diffAuditSnapshots(before, after),
    [before, after],
  )
  const visible = useMemo(() => flattenVisibleChanges(changes), [changes])

  return (
    <section aria-labelledby="audit-diff-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-start">
        <h2 id="audit-diff-heading" className="text-base font-semibold">
          {t("audit.diff")}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={showFull ? "primary" : "ghost"}
            onClick={() => setShowFull((v) => !v)}
          >
            {showFull ? t("audit.diffChangesOnly") : t("audit.diffFullObjects")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={showRaw ? "primary" : "ghost"}
            onClick={() => setShowRaw((v) => !v)}
          >
            {showRaw ? t("audit.diffReadable") : t("audit.diffRawJson")}
          </Button>
        </div>
      </div>

      {showRaw ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <pre
            dir="ltr"
            className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs"
          >
            {JSON.stringify(before, null, 2) ?? "null"}
          </pre>
          <pre
            dir="ltr"
            className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs"
          >
            {JSON.stringify(after, null, 2) ?? "null"}
          </pre>
        </div>
      ) : showFull ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {t("audit.before")}
            </p>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs"
            >
              {JSON.stringify(before, null, 2) ?? "null"}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {t("audit.after")}
            </p>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs"
            >
              {JSON.stringify(after, null, 2) ?? "null"}
            </pre>
          </div>
        </div>
      ) : (
        <div className={cn("space-y-2")}>
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("audit.noChanges")}
            </p>
          ) : (
            visible.map((c, i) => <ChangeRow key={i} change={c} />)
          )}
        </div>
      )}
    </section>
  )
}
