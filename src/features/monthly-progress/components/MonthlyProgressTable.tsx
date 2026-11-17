import { PersonCell, VillaCell } from "@/shared/list/cells"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import Button from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import { Progress } from "@/shared/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { MonthlyProgressItem, MonthlyProgressSortField } from "../api"
import { changeText } from "./monthlyProgressFormat"

type SortMode = "asc" | "desc" | "none"

type Props = {
  rows: MonthlyProgressItem[]
  loading: boolean
  previousLabel: string
  currentLabel: string
  sortOf: (field: MonthlyProgressSortField) => SortMode
  onSort: (field: MonthlyProgressSortField) => void
}

type SortHeadProps = {
  field: MonthlyProgressSortField
  label: string
  sortOf: (field: MonthlyProgressSortField) => SortMode
  onSort: (field: MonthlyProgressSortField) => void
}

function SortHead({ field, label, sortOf, onSort }: SortHeadProps) {
  const mode = sortOf(field)
  return (
    <TableHead
      className="px-4 py-2.5"
      aria-sort={
        mode === "desc" ? "descending" : mode === "asc" ? "ascending" : "none"
      }
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
        onClick={() => onSort(field)}
      >
        {label}
        <Icon
          name={
            mode === "desc" ? "sortDesc" : mode === "asc" ? "sortAsc" : "sort"
          }
          size={14}
        />
      </Button>
    </TableHead>
  )
}

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="flex min-w-32 items-center gap-2">
      <Progress value={value} className="h-1.5 flex-1" />
      <span className="w-12 shrink-0 text-end text-sm tabular-nums">
        {value}%
      </span>
    </div>
  )
}

/** Each villa: last month, this month and the change. */
export default function MonthlyProgressTable({
  rows,
  loading,
  previousLabel,
  currentLabel,
  sortOf,
  onSort,
}: Props) {
  const { t } = useTranslation()
  const columnCount = 6
  const sort = { sortOf, onSort }

  return (
    <div className="list-surface overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="list-head-row">
            <SortHead
              field="villaNumber"
              label={t("monthlyProgress.villaNumber")}
              {...sort}
            />
            <TableHead className="px-4 py-2.5">
              {t("monthlyProgress.location")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("monthlyProgress.contractor")}
            </TableHead>
            <SortHead field="previous" label={previousLabel} {...sort} />
            <SortHead field="current" label={currentLabel} {...sort} />
            <SortHead
              field="change"
              label={t("monthlyProgress.change")}
              {...sort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            <TableBodySkeleton columns={columnCount} rows={8} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {t("monthlyProgress.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.villa.id}
                tone={row.change > 0 ? "success" : undefined}
              >
                <TableCell className="px-4 py-3 text-sm font-medium">
                  <VillaCell
                    id={row.villa.id}
                    villaNumber={row.villa.villaNumber}
                  />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  {row.villa.location}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  <PersonCell name={row.contractor?.name} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  {row.previousProgress === null ? (
                    <span className="text-xs text-muted-foreground">
                      {t("monthlyProgress.notAddedYet")}
                    </span>
                  ) : (
                    <ProgressCell value={row.previousProgress} />
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ProgressCell value={row.currentProgress} />
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 py-3 text-sm font-semibold tabular-nums",
                    row.change > 0
                      ? "text-success"
                      : row.change < 0
                        ? "text-danger"
                        : "text-muted-foreground",
                  )}
                >
                  {changeText(row.change)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
