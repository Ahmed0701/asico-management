import { Link, useLocation, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import i18n from "@/shared/i18n"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import { toApiError } from "@/shared/api/errors"
import { useAuditDetailQuery } from "../api"
import AuditActionLabel from "../components/AuditActionLabel"
import AuditChangeDiff from "../components/AuditChangeDiff"
import {
  AuditDetailField,
  AuditDetailFieldGrid,
} from "../components/AuditDetailFields"
import AuditEntityCell from "../components/AuditEntityCell"
import AuditListErrorBanner from "../components/AuditListErrorBanner"
import { AuditDetailSkeleton } from "@/shared/ui/loading-skeletons"

function formatLocalTime(iso: string): string {
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date(iso))
}

export default function AuditLogDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const listSearch =
    (location.state as { listSearch?: string } | null)?.listSearch ?? ""
  const backTo = `/audit${listSearch}`
  const {
    data: entry,
    isLoading,
    isError,
    error,
    refetch,
  } = useAuditDetailQuery(id)
  if (isLoading) {
    return <AuditDetailSkeleton />
  }

  if (isError || !entry) {
    const apiErr = error ? toApiError(error) : null
    const notFound =
      apiErr?.code === "AUDIT_LOG_NOT_FOUND" || apiErr?.status === 404
    return (
      <Card className="mx-auto mt-12 max-w-lg p-8 text-center">
        <h1 className="text-lg font-semibold">
          {notFound ? t("audit.notFoundTitle") : t("audit.errorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {notFound ? t("audit.notFoundBody") : apiErr?.message}
        </p>
        <AuditListErrorBanner error={apiErr} onRetry={() => void refetch()} />
        <Link
          to={backTo}
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          {t("audit.backToList")}
        </Link>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-4">
        <Link to={backTo} className="text-sm text-accent hover:underline">
          {t("audit.backToList")}
        </Link>
      </div>
      <PageHeader title={t("audit.detailTitle")} subtitle={entry.actionLabel} />
      <Card className="mb-6 p-4 sm:p-5">
        <AuditDetailFieldGrid columns="two">
          <AuditDetailField boxed label={t("audit.when")}>
            <time
              className="tabular-nums"
              dateTime={entry.createdAt}
              title={entry.createdAt}
            >
              {formatLocalTime(entry.createdAt)}
            </time>
          </AuditDetailField>
          <AuditDetailField boxed label={t("audit.action")}>
            <span title={entry.action}>
              <AuditActionLabel
                action={entry.action}
                actionLabel={entry.actionLabel}
              />
            </span>
          </AuditDetailField>
          <AuditDetailField boxed label={t("audit.actor")}>
            {entry.actor ? (
              <div className="flex flex-col gap-0.5 text-start">
                <span dir="auto" className="font-medium">
                  {entry.actor.name}
                </span>
                <span
                  dir="ltr"
                  className="block w-full truncate text-start text-xs text-muted-foreground"
                >
                  {entry.actor.email}
                </span>
              </div>
            ) : (
              t("audit.deletedActor")
            )}
          </AuditDetailField>
          <AuditDetailField boxed label={t("audit.entity")}>
            <AuditEntityCell
              entity={entry.entity}
              entityCode={entry.entityCode}
              entityName={entry.entityName}
              entityDetail={entry.entityDetail}
              entityId={entry.entityId}
            />
          </AuditDetailField>
          <AuditDetailField boxed label={t("audit.ip")}>
            <span dir="ltr" className="font-mono text-xs">
              {entry.ip ?? t("common.none")}
            </span>
          </AuditDetailField>
          <AuditDetailField
            boxed
            label={t("audit.userAgent")}
            className="sm:col-span-2"
          >
            {entry.userAgent ? (
              <p
                dir="ltr"
                className="font-mono text-xs leading-relaxed break-all text-muted-foreground"
              >
                {entry.userAgent}
              </p>
            ) : (
              t("common.none")
            )}
          </AuditDetailField>
        </AuditDetailFieldGrid>
      </Card>
      <Card className="p-4 sm:p-5">
        <AuditChangeDiff before={entry.before} after={entry.after} />
      </Card>
    </>
  )
}
