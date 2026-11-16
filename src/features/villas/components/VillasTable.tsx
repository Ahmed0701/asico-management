import { PersonCell, VillaCell } from "@/shared/list/cells"
import { useTranslation } from "react-i18next"
import i18n from "@/shared/i18n"
import { cn } from "@/shared/lib/cn"
import ProgressCell from "@/shared/list/ProgressCell"
import SortableHead from "@/shared/list/SortableHead"
import { Badge } from "@/shared/ui/Badge"
import { IconButton } from "@/shared/ui/Button"
import { RowActions } from "@/shared/ui/DataTable"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { VillaListItem } from "../api"
import { daysUntil } from "../lib/villaDetailDisplay"

// A calendar day (YYYY-MM-DD) as "12 Mar 2027", read as that day wherever the computer is.
function formatDate(iso: string | null): string {
  if (!iso) return "-"
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00.000Z`))
}

type TargetProps = {
  day: string | null
  done: boolean
}

// The target date, and how far it is: days left, due today, or overdue (until the villa is done).
function Target({ day, done }: TargetProps) {
  const { t } = useTranslation()
  if (!day) return <span className="text-muted-foreground">-</span>
  const left = daysUntil(day)
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="tabular-nums">{formatDate(day)}</span>
      {!done && (
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
            left < 0
              ? "bg-danger-soft text-danger"
              : left <= 14
                ? "bg-progress-soft text-progress"
                : "bg-muted text-muted-foreground",
          )}
        >
          {left < 0
            ? t("villas.hero.overdueBy", { count: -left })
            : left === 0
              ? t("villas.hero.dueToday")
              : t("villas.hero.daysLeft", { count: left })}
        </span>
      )}
    </div>
  )
}

type Props = {
  rows: VillaListItem[]
  isLoading: boolean
  canUpdate: boolean
  canDelete: boolean
  canLinkDetail: boolean
  onEdit: (row: VillaListItem) => void
  onDelete: (row: VillaListItem) => void
  sort: string | undefined
  onSort: (next: string) => void
}

/** The villas: number and owner, type, location, the people on it, progress and target. */
export default function VillasTable({
  rows,
  isLoading,
  canUpdate,
  canDelete,
  canLinkDetail,
  onEdit,
  onDelete,
  sort,
  onSort,
}: Props) {
  const { t } = useTranslation()
  const showActions = canUpdate || canDelete
  const colCount = 8 + (showActions ? 1 : 0)

  return (
    <div className="list-surface overflow-x-auto">
      <Table className="min-w-260">
        <TableHeader>
          <TableRow className="list-head-row">
            <SortableHead
              label={t("villas.villaNumber")}
              field="villaNumber"
              sort={sort}
              onSort={onSort}
            />
            <TableHead className="px-4 py-2.5">
              {t("villas.villaType")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villas.location")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villas.electricalEngineer")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villas.civilEngineer")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villas.contractor")}
            </TableHead>
            <SortableHead
              label={t("villas.progress")}
              field="progress"
              sort={sort}
              onSort={onSort}
            />
            <SortableHead
              label={t("villas.targetDate")}
              field="targetDate"
              sort={sort}
              onSort={onSort}
            />
            {showActions && (
              <TableHead className="px-4 py-2.5 text-end">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && !rows.length ? (
            <TableBodySkeleton columns={colCount} rows={8} />
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-3">
                  <VillaCell
                    villaNumber={row.villaNumber}
                    id={canLinkDetail ? row.id : undefined}
                    sub={row.ownerName ?? t("villas.noOwner")}
                    done={row.progress >= 100}
                  />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {row.villaType ? (
                    <Badge
                      tone={
                        row.villaType === "ACICO_SYSTEM" ? "info" : "neutral"
                      }
                    >
                      {t(`villas.villaTypes.${row.villaType}`)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  <span className="font-medium">{row.area}</span>
                  <p className="text-xs text-muted-foreground">
                    {t("villas.blockPlotLine", {
                      block: row.block,
                      plot: row.plot,
                    })}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <PersonCell name={row.electricalEngineer?.name} />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <PersonCell name={row.civilEngineer.name} />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <PersonCell name={row.contractor?.name} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ProgressCell value={row.progress} />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <Target day={row.targetDate} done={row.progress >= 100} />
                </TableCell>
                {showActions && (
                  <TableCell className="px-4 py-3">
                    <RowActions>
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
