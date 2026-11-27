import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { cn } from "@/shared/lib/cn"
import { IconButton } from "@/shared/ui/Button"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { StoreMovement } from "../api"
import { formatChange, formatQuantity, unitLabel } from "../lib/storeFormat"
import { StoreKindBadge } from "./StoreBadges"
import ColoredItemName from "./ColoredItemName"

const day = (value: string) => formatCalendarDateUtc(`${value}T00:00:00.000Z`)

// The party is in the "To" column when there is no villa there; otherwise it is a detail. Then the reference, the note,
// and who recorded it.
function detailsOf(m: StoreMovement, showVilla: boolean): string[] {
  const party = showVilla && !m.villa ? null : m.party
  return [party, m.reference, m.note, m.createdBy?.name].filter(
    (part): part is string => Boolean(part),
  )
}

type Props = {
  rows: StoreMovement[]
  loading: boolean
  /** Hidden on a villa's page, where every row is for that villa. */
  showVilla?: boolean
  /** Shown where the list is not of one store (a villa's page). */
  showStore?: boolean
  /** Shows the take-back button on each item's last movement. */
  canUndo: boolean
  onUndo: (movement: StoreMovement) => void
}

/** The stock movements, newest first: what came in, what went out and where, and the stock after each. */
export default function StoreMovementsTable({
  rows,
  loading,
  showVilla = true,
  showStore = false,
  canUndo,
  onUndo,
}: Props) {
  const { t } = useTranslation()
  const columnCount =
    (showVilla ? 7 : 6) + (showStore ? 1 : 0) + (canUndo ? 1 : 0)
  // A transfer names the other store where a receipt names its supplier.
  const otherSide = (m: StoreMovement): string | null =>
    m.transfer
      ? t(m.change < 0 ? "store.transferTo" : "store.transferFrom", {
          store: m.transfer.warehouse.name,
        })
      : null

  return (
    <div className="list-surface overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="list-head-row">
            <TableHead className="px-4 py-2.5">{t("store.movedOn")}</TableHead>
            {showStore && (
              <TableHead className="px-4 py-2.5">
                {t("store.storeLabel")}
              </TableHead>
            )}
            <TableHead className="px-4 py-2.5">{t("store.item")}</TableHead>
            <TableHead className="px-4 py-2.5">{t("store.kind")}</TableHead>
            <TableHead className="px-4 py-2.5">{t("store.change")}</TableHead>
            <TableHead className="px-4 py-2.5">
              {t("store.balanceAfter")}
            </TableHead>
            {showVilla && (
              <TableHead className="px-4 py-2.5">{t("store.to")}</TableHead>
            )}
            <TableHead className="px-4 py-2.5">{t("store.details")}</TableHead>
            {canUndo && (
              <TableHead className="px-4 py-2.5">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            <TableBodySkeleton columns={columnCount} rows={6} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {t("store.noMovements")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="px-4 py-3 text-sm tabular-nums">
                  {day(m.movedOn)}
                </TableCell>
                {showStore && (
                  <TableCell className="px-4 py-3 text-sm">
                    {m.warehouse.name}
                  </TableCell>
                )}
                <TableCell className="px-4 py-3 text-sm font-medium" dir="auto">
                  <ColoredItemName
                    name={m.item.name}
                    factory={m.item.factory?.name}
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StoreKindBadge kind={m.kind} />
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 py-3 text-sm font-semibold tabular-nums",
                    m.change > 0 ? "text-success" : "text-danger",
                  )}
                  dir="ltr"
                >
                  {formatChange(m.change)}{" "}
                  <span className="font-normal text-muted-foreground">
                    {unitLabel(m.item.unit)}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm tabular-nums">
                  {formatQuantity(m.balanceAfter)}{" "}
                  <span className="text-muted-foreground">
                    {unitLabel(m.item.unit)}
                  </span>
                </TableCell>
                {showVilla && (
                  <TableCell className="px-4 py-3 text-sm" dir="auto">
                    {m.villa ? (
                      <Link
                        to={`/villas/${m.villa.id}?tab=store`}
                        className="text-accent hover:underline"
                      >
                        {m.villa.villaNumber}
                      </Link>
                    ) : (
                      (otherSide(m) ?? m.party ?? "-")
                    )}
                  </TableCell>
                )}
                <TableCell className="max-w-xs px-4 py-3 text-xs text-muted-foreground">
                  {detailsOf(m, showVilla).map((part, index) => (
                    <span
                      key={index}
                      className="block truncate"
                      dir="auto"
                      title={part}
                    >
                      {part}
                    </span>
                  ))}
                </TableCell>
                {canUndo && (
                  <TableCell className="px-4 py-3">
                    <div className="row-actions flex justify-end">
                      {m.latest && (
                        <IconButton
                          icon="x"
                          variant="danger"
                          label={t("store.undoOf", { name: m.item.name })}
                          onClick={() => onUndo(m)}
                        />
                      )}
                    </div>
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
