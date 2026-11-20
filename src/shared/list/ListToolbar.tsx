import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/shared/lib/cn"
import { SearchInput } from "@/shared/ui/Field"

type SearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  id?: string
}

type Props = {
  /** The search box, first and widest. */
  search?: SearchProps
  /** The filters, laid out in an even grid; each one keeps its own label. */
  children?: ReactNode
  /** A filters bar that lays itself out (give its grid the `list-toolbar-filters` class); shown as it is. */
  filters?: ReactNode
  /** How many rows match, shown beside the title. */
  count?: number
  /** How many filters (search included) are set; with `onClear`, shows the chip and the Clear filters button. */
  activeCount?: number
  onClear?: () => void
  /** Buttons at the end of the title row (Add, Export...). */
  actions?: ReactNode
  /** Columns of the filter grid on wide screens (default: up to 4). */
  columns?: 2 | 3 | 4 | 5
  className?: string
}

const GRID: Record<NonNullable<Props["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
}

/**
 * The search and filters of a list, the same on every page: a title row (how many rows match, how many filters are
 * set, Clear filters, and the page's buttons), the search box across, and the filters in an even grid under it.
 */
export default function ListToolbar({
  search,
  children,
  filters,
  count,
  activeCount = 0,
  onClear,
  actions,
  columns = 4,
  className,
}: Props) {
  const { t } = useTranslation()
  const hasFilters =
    (children !== undefined && children !== null && children !== false) ||
    Boolean(filters)

  return (
    <section
      aria-label={t("common.searchAndFilters")}
      className={cn("list-toolbar p-3 sm:p-4", className)}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <SlidersHorizontal size={15} strokeWidth={1.9} aria-hidden />
        </span>
        <h2 className="text-sm font-semibold">
          {t("common.searchAndFilters")}
        </h2>
        {count !== undefined && (
          <span
            className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground"
            data-testid="list-toolbar-count"
          >
            {t("common.resultCount", { count })}
          </span>
        )}
        {activeCount > 0 && (
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium tabular-nums text-accent">
            {t("common.activeFilters", { count: activeCount })}
          </span>
        )}
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {activeCount > 0 && onClear && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
              onClick={onClear}
            >
              <X size={13} aria-hidden />
              {t("common.clearFilters")}
            </button>
          )}
          {actions}
        </div>
      </div>
      {search && (
        <SearchInput
          id={search.id}
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
          className={hasFilters ? "mb-3" : undefined}
        />
      )}
      {filters}
      {hasFilters && !filters && (
        <div
          className={cn(
            "list-toolbar-filters grid grid-cols-1 items-end gap-3",
            GRID[columns],
          )}
        >
          {children}
        </div>
      )}
    </section>
  )
}

/** How many of these filter values are set (not empty, not false). */
export function countActive(...values: unknown[]): number {
  return values.filter(
    (value) =>
      value !== undefined && value !== null && value !== "" && value !== false,
  ).length
}

/** The address of a list with every search and filter cleared: only the sort, the page size and the tab are kept. */
export function clearedListParams(
  searchParams: URLSearchParams,
  keep: readonly string[] = ["sort", "limit", "tab"],
): URLSearchParams {
  const next = new URLSearchParams()
  for (const key of keep) {
    const value = searchParams.get(key)
    if (value) next.set(key, value)
  }
  return next
}
