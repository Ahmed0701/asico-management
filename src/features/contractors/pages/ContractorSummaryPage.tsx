import { useCallback } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import PhoneDisplay from "@/shared/ui/PhoneDisplay"
import Button from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  buildContractorSummaryQueryParams,
  useContractorSummaryParams,
  useContractorSummaryQuery,
} from "../api"
import { downloadExport } from "@/shared/export/downloadExport"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import ContractorsListErrorBanner from "../components/ContractorsListErrorBanner"
import ContractorsListFooter from "../components/ContractorsListFooter"
import {
  ContractorSummarySkeleton,
  TableBodySkeleton,
} from "@/shared/ui/loading-skeletons"
import { contractorSummaryLinks } from "../lib/contractorSummaryLinks"
import { formatDashboardCount } from "@/features/dashboard/lib/formatDashboardNumber"
import DashboardLinkCard from "@/features/dashboard/components/DashboardLinkCard"

function DateCell({
  iso,
  notSetLabel,
}: {
  iso: string | null
  notSetLabel: string
}) {
  if (!iso) {
    return <span className="text-muted-foreground">{notSetLabel}</span>
  }
  return (
    <span dir="ltr" className="tabular-nums whitespace-nowrap">
      {formatCalendarDateUtc(`${iso}T00:00:00.000Z`)}
    </span>
  )
}

export default function ContractorSummaryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { can } = usePermissions()
  const canReadList = can("contractors:read")
  const canProjectDetail = can("villas:detail")
  const canExport = can("contractors:summary")

  const { params, setPage, setLimit, toggleSort } = useContractorSummaryParams()

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      if (!id) return
      await downloadExport({
        path: `/contractors/${id}/summary/export`,
        query: buildContractorSummaryQueryParams(params, { forExport: true }),
        format,
        filenameStem: "contractor-summary",
        signal,
      })
    },
    [id, params],
  )
  const { data, isLoading, isError, error, refetch } =
    useContractorSummaryQuery(id)

  const apiError = isError ? toApiError(error) : null
  const forbidden = apiError?.status === 403
  const notFound =
    apiError?.code === "CONTRACTOR_NOT_FOUND" || apiError?.status === 404

  const summary = data?.data
  const meta = data?.meta
  const rows = summary?.villas ?? []
  const links = id ? contractorSummaryLinks(id) : null

  const sort = params.sort ?? ""
  const villaNumberSort =
    sort === "villaNumber:desc"
      ? "desc"
      : sort.startsWith("startDate") || sort.startsWith("targetDate")
        ? "none"
        : "default"
  const startSort = sort.startsWith("startDate")
    ? sort === "startDate:asc"
      ? "asc"
      : "desc"
    : "none"
  const targetSort = sort.startsWith("targetDate")
    ? sort === "targetDate:asc"
      ? "asc"
      : "desc"
    : "none"

  const pastEnd =
    meta && meta.page > Math.max(1, meta.totalPages) && meta.total > 0

  if (isLoading && !summary) {
    return <ContractorSummarySkeleton />
  }

  if (forbidden) {
    return (
      <Card className="mx-auto mt-16 max-w-md p-10 text-center">
        <h1 className="text-lg font-semibold">{t("audit.forbiddenTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("audit.forbiddenBody")}
        </p>
      </Card>
    )
  }

  if (notFound || (!summary && isError)) {
    return (
      <Card className="mx-auto mt-12 max-w-lg p-8 text-center">
        <h1 className="text-lg font-semibold">
          {t("contractors.notFoundTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("contractors.notFoundBody")}
        </p>
        {canReadList && (
          <Link
            to="/contractors"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            {t("contractors.backToList")}
          </Link>
        )}
      </Card>
    )
  }

  if (!summary || !links) return null

  return (
    <div className="contractor-summary-print">
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .contractor-summary-print table { page-break-inside: auto; }
          .contractor-summary-print tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>
      <div className="print:hidden mb-4 flex flex-wrap items-center gap-3">
        {canReadList && (
          <Link
            to="/contractors"
            className="text-sm text-accent hover:underline"
          >
            {t("contractors.backToList")}
          </Link>
        )}
        {canExport ? (
          <div className="ms-auto">
            <ListPageHeaderActions
              placement="inline"
              exportAction={{
                kind: "menu",
                total: meta?.total,
                listLoading: isLoading,
                onExport,
                onContractorNotFound: () =>
                  navigate("/contractors", { replace: true }),
                extraHint: (
                  <p className="text-xs text-muted-foreground">
                    {t("export.summaryTotalsNote")}
                  </p>
                ),
              }}
            />
          </div>
        ) : null}
      </div>
      <PageHeader title={summary.contractor.name} />
      <p className="-mt-4 mb-2 text-sm text-muted-foreground">
        <PhoneDisplay phone={summary.contractor.phone} />
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("contractors.summaryVillaCount", { count: summary.villaCount })}
      </p>

      <div className="print:hidden mb-6 space-y-4">
        {summary.openWorks && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">
              {t("contractors.summaryOpenWorksTitle")}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardLinkCard
                to={links.openWorks}
                label={t("dashboard.openWorksTotal")}
                value={formatDashboardCount(summary.openWorks.total)}
              />
              <DashboardLinkCard
                to={links.openWorksDelayed}
                label={t("dashboard.openWorksDelayed")}
                value={formatDashboardCount(summary.openWorks.delayed)}
                valueClassName={
                  summary.openWorks.delayed > 0 ? "text-danger" : undefined
                }
              />
              <DashboardLinkCard
                to={links.openWorksOverdue}
                label={t("dashboard.openWorksOverdueShort")}
                value={formatDashboardCount(summary.openWorks.overdue)}
                valueClassName={
                  summary.openWorks.overdue > 0 ? "text-danger" : undefined
                }
              />
            </div>
          </Card>
        )}
        {summary.smallWorks && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">
              {t("contractors.summarySmallWorksTitle")}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardLinkCard
                to={links.smallWorks}
                label={t("dashboard.smallWorksTotal")}
                value={formatDashboardCount(summary.smallWorks.total)}
              />
              <DashboardLinkCard
                to={links.smallWorksPending}
                label={t("contractors.summarySmallWorksPending")}
                value={formatDashboardCount(summary.smallWorks.pending)}
              />
              <DashboardLinkCard
                to={links.smallWorksDueSoon}
                label={t("smallWorks.badge.dueSoon")}
                value={formatDashboardCount(summary.smallWorks.dueSoon)}
                valueClassName={
                  summary.smallWorks.dueSoon > 0 ? "text-accent" : undefined
                }
              />
              <DashboardLinkCard
                to={links.smallWorksOverdue}
                label={t("smallWorks.badge.overdue")}
                value={formatDashboardCount(summary.smallWorks.overdue)}
                valueClassName={
                  summary.smallWorks.overdue > 0 ? "text-danger" : undefined
                }
              />
            </div>
          </Card>
        )}
        {summary.dailyReports && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">
              {t("contractors.summaryDailyReportsTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("contractors.summaryDailyReportsCount", {
                count: summary.dailyReports.count,
              })}
              {summary.dailyReports.lastReportDate
                ? ` · ${t("contractors.summaryLastReportDate", {
                    date: formatCalendarDateUtc(
                      `${summary.dailyReports.lastReportDate}T00:00:00.000Z`,
                    ),
                  })}`
                : ` · ${t("contractors.summaryNoReportDate")}`}
            </p>
            <Link
              to={links.dailyReports}
              className="mt-2 inline-block text-xs text-accent hover:underline"
            >
              {t("contractors.summaryViewDailyReports")}
            </Link>
          </Card>
        )}
        {summary.labour && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">
              {t("contractors.summaryLabourTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("contractors.summaryLabourStats", {
                entries: summary.labour.entries,
                total: summary.labour.totalLabour,
              })}
              {summary.labour.lastLabourDate
                ? ` · ${t("contractors.summaryLastLabourDate", {
                    date: formatCalendarDateUtc(
                      `${summary.labour.lastLabourDate}T00:00:00.000Z`,
                    ),
                  })}`
                : ` · ${t("contractors.summaryNoLabourDate")}`}
            </p>
            <Link
              to={links.labour}
              className="mt-2 inline-block text-xs text-accent hover:underline"
            >
              {t("contractors.summaryViewLabour")}
            </Link>
          </Card>
        )}
      </div>

      <ContractorsListErrorBanner
        error={
          apiError && !notFound && !forbidden && apiError.status >= 500
            ? apiError
            : null
        }
        onRetry={() => void refetch()}
      />
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            {t("contractors.summaryVillasTitle")}
          </h2>
        </div>
        <Table className="min-w-180">
          <TableHeader>
            <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted/60">
              <TableHead className="px-4 py-2.5 font-medium">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="print:hidden h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                  onClick={() => toggleSort("villaNumber")}
                  aria-sort={
                    villaNumberSort === "desc"
                      ? "descending"
                      : villaNumberSort === "default"
                        ? "ascending"
                        : "none"
                  }
                >
                  {t("contractors.summaryColVillaNumber")}
                  <Icon
                    name={
                      villaNumberSort === "desc"
                        ? "sortDesc"
                        : villaNumberSort === "default"
                          ? "sortAsc"
                          : "sort"
                    }
                    size={14}
                  />
                </Button>
                <span className="hidden print:inline">
                  {t("contractors.summaryColVillaNumber")}
                </span>
              </TableHead>
              <TableHead className="px-4 py-2.5 font-medium">
                {t("contractors.summaryColArea")}
              </TableHead>
              <TableHead className="px-4 py-2.5 font-medium">
                {t("contractors.summaryColBlock")}
              </TableHead>
              <TableHead className="px-4 py-2.5 font-medium">
                {t("contractors.summaryColPlot")}
              </TableHead>
              <TableHead className="px-4 py-2.5 font-medium">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="print:hidden h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                  onClick={() => toggleSort("startDate")}
                  title={t("contractors.summaryDateSortHint")}
                  aria-sort={
                    startSort === "desc"
                      ? "descending"
                      : startSort === "asc"
                        ? "ascending"
                        : "none"
                  }
                >
                  {t("contractors.summaryColStartDate")}
                  <Icon
                    name={
                      startSort === "desc"
                        ? "sortDesc"
                        : startSort === "asc"
                          ? "sortAsc"
                          : "sort"
                    }
                    size={14}
                  />
                </Button>
                <span
                  className="hidden print:inline"
                  title={t("contractors.summaryDateSortHint")}
                >
                  {t("contractors.summaryColStartDate")}
                </span>
              </TableHead>
              <TableHead className="px-4 py-2.5 font-medium">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="print:hidden h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                  onClick={() => toggleSort("targetDate")}
                  title={t("contractors.summaryDateSortHint")}
                  aria-sort={
                    targetSort === "desc"
                      ? "descending"
                      : targetSort === "asc"
                        ? "ascending"
                        : "none"
                  }
                >
                  {t("contractors.summaryColTargetDate")}
                  <Icon
                    name={
                      targetSort === "desc"
                        ? "sortDesc"
                        : targetSort === "asc"
                          ? "sortAsc"
                          : "sort"
                    }
                    size={14}
                  />
                </Button>
                <span
                  className="hidden print:inline"
                  title={t("contractors.summaryDateSortHint")}
                >
                  {t("contractors.summaryColTargetDate")}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableBodySkeleton
                columns={6}
                rows={6}
                cellClassName="px-4 py-3"
              />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {t("contractors.summaryVillasEmpty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell dir="ltr" className="px-4 py-3 font-mono text-xs">
                    {canProjectDetail ? (
                      <Link
                        to={`/villas/${encodeURIComponent(row.id)}`}
                        className="hover:underline"
                      >
                        {row.villaNumber}
                      </Link>
                    ) : (
                      row.villaNumber
                    )}
                  </TableCell>
                  <TableCell dir="ltr" className="px-4 py-3">
                    {row.area}
                  </TableCell>
                  <TableCell dir="ltr" className="px-4 py-3">
                    {row.block}
                  </TableCell>
                  <TableCell dir="ltr" className="px-4 py-3">
                    {row.plot}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <DateCell
                      iso={row.startDate}
                      notSetLabel={t("contractors.dateNotSet")}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <DateCell
                      iso={row.targetDate}
                      notSetLabel={t("contractors.dateNotSet")}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pastEnd && meta && (
        <div className="border border-t-0 border-border px-6 py-10 text-center print:hidden">
          <p className="text-sm text-muted-foreground">
            {t("contractors.summaryPagePastEnd")}
          </p>
          <Button
            type="button"
            className="mt-2"
            variant="ghost"
            onClick={() => setPage(meta.totalPages)}
          >
            {t("contractors.goToLastPage")}
          </Button>
        </div>
      )}
      {meta && !pastEnd && (
        <div className="print:hidden">
          <ContractorsListFooter
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
            onGoLastPage={() => setPage(meta.totalPages)}
            rangeKey="contractors.summaryShowingRange"
            lastPageKey="contractors.goToLastPage"
          />
        </div>
      )}
    </div>
  )
}
