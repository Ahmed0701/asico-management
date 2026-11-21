import { Avatar } from "@/shared/list/cells"
import {
  ArrowRightLeft,
  Building2,
  Mail,
  Phone,
  UserCheck,
  UserX,
} from "lucide-react"
import { cn } from "@/shared/lib/cn"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router"
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
import type { ElectricalEngineer } from "../api"

type ProjectsCountCellProps = {
  id: string
  count: number
}

function ProjectsCountCell({ id, count }: ProjectsCountCellProps) {
  const { can } = usePermissions()
  const { t } = useTranslation()
  const pill = cn(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
    count > 0
      ? "bg-progress-soft text-progress"
      : "bg-muted text-muted-foreground",
  )
  const text = t("electricalEngineers.villasPill", { count })
  if (can("villas:read") && count > 0) {
    return (
      <Link
        to={`/villas?electricalEngineerId=${id}`}
        className={cn(pill, "hover:underline")}
      >
        <Building2 size={12} aria-hidden />
        {text}
      </Link>
    )
  }
  return (
    <span className={pill}>
      <Building2 size={12} aria-hidden />
      {text}
    </span>
  )
}

function formatCreated(iso: string, part: "date" | "time"): string {
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  return new Intl.DateTimeFormat(
    locale,
    part === "date" ? { dateStyle: "medium" } : { timeStyle: "short" },
  ).format(new Date(iso))
}

export default function ElectricalEngineersTable({
  rows,
  isLoading,
  nameSort,
  createdSort,
  onToggleNameSort,
  onToggleCreatedSort,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onTransfer,
  onToggleStatus,
  statusPendingId,
  deleteDisabled,
  deleteDisabledTitle,
}: {
  rows: ElectricalEngineer[]
  isLoading: boolean
  nameSort: "asc" | "desc" | "default" | "none"
  createdSort: "asc" | "desc" | "none"
  onToggleNameSort: () => void
  onToggleCreatedSort: () => void
  canUpdate: boolean
  canDelete: boolean
  onEdit: (row: ElectricalEngineer) => void
  onDelete: (row: ElectricalEngineer) => void
  onTransfer?: (row: ElectricalEngineer) => void
  onToggleStatus?: (row: ElectricalEngineer, active: boolean) => void
  statusPendingId?: string | null
  deleteDisabled: (row: ElectricalEngineer) => boolean
  deleteDisabledTitle: (row: ElectricalEngineer) => string | undefined
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const skeletonRows = 8
  const showActions = canUpdate || canDelete || !!onTransfer
  const colCount = showActions ? 6 : 5

  return (
    <div className="list-surface overflow-hidden">
      <Table className="min-w-160">
        <TableHeader>
          <TableRow className="list-head-row">
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
                aria-label={t("electricalEngineers.sortName")}
              >
                {t("electricalEngineers.name")}
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
              {t("electricalEngineers.contact")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("electricalEngineers.userAccount")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("electricalEngineers.projectsCount")}
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
                aria-label={t("electricalEngineers.sortCreated")}
              >
                {t("electricalEngineers.createdAt")}
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
              <TableRow
                key={row.id}
                className={cn(row.status === "INACTIVE" && "opacity-60")}
              >
                <TableCell className="px-4 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={row.name}
                      className={cn(
                        "size-9 text-xs",
                        row.status === "ACTIVE"
                          ? "bg-accent/10 text-accent"
                          : "bg-muted text-muted-foreground",
                      )}
                    />
                    <span className="grid min-w-0 gap-0.5">
                      <Link
                        to={`/electrical-engineers/${row.id}`}
                        state={{ listSearch: location.search }}
                        dir="auto"
                        className="truncate font-semibold hover:underline"
                      >
                        {row.name}
                      </Link>
                      <span
                        className={cn(
                          "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          row.status === "ACTIVE"
                            ? "bg-success-soft text-success"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full bg-current"
                        />
                        {t(`directory.statusLabels.${row.status}`)}
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="grid gap-1 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone
                        size={13}
                        className="text-muted-foreground"
                        aria-hidden
                      />
                      <PhoneDisplay phone={row.phone} />
                    </span>
                    {row.email && (
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail size={13} aria-hidden />
                        <DirectoryEmailDisplay value={row.email} />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {row.user ? (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-open/30 bg-open-soft px-2.5 py-1.5">
                      <UserCheck
                        size={14}
                        className="shrink-0 text-open"
                        aria-hidden
                      />
                      <span className="grid min-w-0">
                        <span
                          className="truncate text-xs font-medium"
                          dir="auto"
                        >
                          {row.user.name}
                        </span>
                        <span
                          className="truncate text-[11px] text-muted-foreground"
                          dir="ltr"
                        >
                          {row.user.email}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
                      <UserX size={13} aria-hidden />
                      {t("electricalEngineers.noUserAccount")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">
                  <ProjectsCountCell id={row.id} count={row.villaCount} />
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap tabular-nums">
                  <span className="grid">
                    <span className="text-sm">
                      {formatCreated(row.createdAt, "date")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCreated(row.createdAt, "time")}
                    </span>
                  </span>
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
                      {onTransfer && row.villaCount > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          title={t("directory.transferVillas.button")}
                          aria-label={t("directory.transferVillas.buttonFor", {
                            name: row.name,
                          })}
                          onClick={() => onTransfer(row)}
                        >
                          <ArrowRightLeft size={14} aria-hidden />
                          {t("directory.transferVillas.button")}
                        </Button>
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
