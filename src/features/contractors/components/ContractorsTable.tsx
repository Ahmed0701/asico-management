import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router"
import { usePermissions } from "@/features/auth/api"
import i18n from "@/shared/i18n"
import Button from "@/shared/ui/Button"
import { IconButton } from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import { RowActions } from "@/shared/ui/DataTable"
import PhoneDisplay from "@/shared/ui/PhoneDisplay"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import DirectoryEmailDisplay from "@/shared/directory/DirectoryEmailDisplay"
import DirectoryPartyStatusControls from "@/shared/directory/DirectoryPartyStatusControls"
import type { Contractor } from "../api"

type ContractorProjectsCountProps = {
  id: string
  count: number
}

function ContractorProjectsCount({ id, count }: ContractorProjectsCountProps) {
  const { can } = usePermissions()
  if (can("villas:read")) {
    return (
      <Link to={`/villas?contractorId=${id}`} className="hover:underline">
        {count}
      </Link>
    )
  }
  return <>{count}</>
}

function formatCreated(iso: string): string {
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export default function ContractorsTable({
  rows,
  isLoading,
  nameSort,
  createdSort,
  onToggleNameSort,
  onToggleCreatedSort,
  canUpdate,
  canDelete,
  canSummary,
  onEdit,
  onDelete,
  onToggleStatus,
  statusPendingId,
  deleteDisabled,
  deleteDisabledTitle,
}: {
  rows: Contractor[]
  isLoading: boolean
  nameSort: "asc" | "desc" | "default" | "none"
  createdSort: "asc" | "desc" | "none"
  onToggleNameSort: () => void
  onToggleCreatedSort: () => void
  canUpdate: boolean
  canDelete: boolean
  canSummary: boolean
  onEdit: (row: Contractor) => void
  onDelete: (row: Contractor) => void
  onToggleStatus?: (row: Contractor, active: boolean) => void
  statusPendingId?: string | null
  deleteDisabled: (row: Contractor) => boolean
  deleteDisabledTitle: (row: Contractor) => string | undefined
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const skeletonRows = 8
  const showActions = canUpdate || canDelete || canSummary
  const colCount = showActions ? 6 : 5

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table className="min-w-160">
        <TableHeader>
          <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted/60">
            <TableHead className="px-4 py-2.5 font-medium">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                onClick={onToggleNameSort}
                aria-sort={
                  nameSort === "desc"
                    ? "descending"
                    : nameSort === "asc" || nameSort === "default"
                      ? "ascending"
                      : "none"
                }
                aria-label={t("contractors.sortName")}
              >
                {t("contractors.name")}
                <Icon
                  name={
                    nameSort === "desc"
                      ? "sortDesc"
                      : nameSort === "asc"
                        ? "sortAsc"
                        : "sort"
                  }
                  size={14}
                />
              </Button>
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("contractors.phone")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("directory.email")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("contractors.projectsCount")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                onClick={onToggleCreatedSort}
                aria-sort={
                  createdSort === "desc"
                    ? "descending"
                    : createdSort === "asc"
                      ? "ascending"
                      : "none"
                }
                aria-label={t("contractors.sortCreated")}
              >
                {t("contractors.createdAt")}
                <Icon
                  name={
                    createdSort === "desc"
                      ? "sortDesc"
                      : createdSort === "asc"
                        ? "sortAsc"
                        : "sort"
                  }
                  size={14}
                />
              </Button>
            </TableHead>
            {showActions && (
              <TableHead className="px-4 py-2.5 text-end font-medium">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && rows.length === 0 ? (
            <TableBodySkeleton
              columns={colCount}
              rows={skeletonRows}
              cellClassName="px-4 py-3"
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/40">
                <TableCell className="px-4 py-3">
                  <Link
                    to={`/contractors/${row.id}`}
                    state={{ listSearch: location.search }}
                    dir="auto"
                    className="font-medium hover:underline"
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <PhoneDisplay phone={row.phone} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <DirectoryEmailDisplay value={row.email} />
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">
                  <ContractorProjectsCount id={row.id} count={row.villaCount} />
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap tabular-nums">
                  {formatCreated(row.createdAt)}
                </TableCell>
                {showActions && (
                  <TableCell className="px-4 py-3">
                    <RowActions>
                      {canUpdate && onToggleStatus && (
                        <DirectoryPartyStatusControls
                          status={row.status}
                          name={row.name}
                          disabled={statusPendingId === row.id}
                          onCheckedChange={(active) =>
                            onToggleStatus(row, active)
                          }
                        />
                      )}
                      {canSummary && (
                        <IconButton
                          icon="folder"
                          label={t("contractors.summaryAction")}
                          onClick={() =>
                            navigate(`/contractors/${row.id}/summary`)
                          }
                        />
                      )}
                      {canUpdate && (
                        <IconButton
                          icon="edit"
                          label={t("common.edit")}
                          onClick={() => onEdit(row)}
                        />
                      )}
                      {canDelete && (
                        <IconButton
                          icon="trash"
                          label={t("common.delete")}
                          disabled={deleteDisabled(row)}
                          title={deleteDisabledTitle(row)}
                          variant="danger"
                          onClick={() => onDelete(row)}
                        />
                      )}
                    </RowActions>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
