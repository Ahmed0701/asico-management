import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import Button from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import { TableHead } from "@/shared/ui/table"

export type SortMode = "asc" | "desc" | "none"

/** How a list's `sort` ("field", "field:asc" or "field:desc") orders `field`: a bare field is ascending. */
export function sortModeOf(sort: string | undefined, field: string): SortMode {
  if (sort === `${field}:desc`) return "desc"
  if (sort === field || sort === `${field}:asc`) return "asc"
  return "none"
}

/** The sort a click asks for: ascending first, then descending, then ascending again. */
export function nextSortOf(sort: string | undefined, field: string): string {
  return sortModeOf(sort, field) === "asc" ? `${field}:desc` : `${field}:asc`
}

type Props = {
  label: string
  field: string
  sort: string | undefined
  onSort: (next: string) => void
  className?: string
}

/**
 * A column header that sorts the list. The arrow is always there: both ways (unsorted), up (ascending) or down
 * (descending), so people can see the column is sortable before they click.
 */
export default function SortableHead({
  label,
  field,
  sort,
  onSort,
  className,
}: Props) {
  const { t } = useTranslation()
  const mode = sortModeOf(sort, field)
  return (
    <TableHead
      className={cn("px-4 py-2.5", className)}
      aria-sort={
        mode === "desc" ? "descending" : mode === "asc" ? "ascending" : "none"
      }
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-auto gap-1 px-0 py-0 text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-transparent hover:text-foreground",
          mode !== "none" && "text-foreground",
        )}
        title={t("common.sortBy", { column: label })}
        onClick={() => onSort(nextSortOf(sort, field))}
      >
        {label}
        <Icon
          name={
            mode === "desc" ? "sortDesc" : mode === "asc" ? "sortAsc" : "sort"
          }
          size={13}
          className={cn(mode === "none" ? "opacity-50" : "text-accent")}
        />
      </Button>
    </TableHead>
  )
}
