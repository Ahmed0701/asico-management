import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import { IconButton } from "@/shared/ui/Button"
import { RowActions } from "@/shared/ui/DataTable"
import { Badge } from "@/shared/ui/Badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import type { ElecPhase } from "../api"

function statusTone(status: ElecPhase["status"]) {
  return status === "ACTIVE" ? "success" : "neutral"
}

export default function ElecPhasesTable({
  rows,
  isLoading,
  canUpdate,
  canDelete,
  canReorder,
  reorderBlockedReason,
  reorderPending,
  orderIndexById,
  orderTotal,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  rows: ElecPhase[]
  isLoading: boolean
  canUpdate: boolean
  canDelete: boolean
  canReorder: boolean
  reorderBlockedReason?: string
  reorderPending: boolean
  orderIndexById: Map<string, number>
  orderTotal: number
  onEdit: (row: ElecPhase) => void
  onDelete: (row: ElecPhase) => void
  onMoveUp: (row: ElecPhase) => void
  onMoveDown: (row: ElecPhase) => void
}) {
  const { t } = useTranslation()
  const skeletonRows = 8
  const showActions = canUpdate || canDelete
  const showReorder = canUpdate
  const colCount = 4 + (showReorder ? 1 : 0) + (showActions ? 1 : 0)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {reorderBlockedReason && canUpdate && (
        <p className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          {reorderBlockedReason}
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted/60">
            <TableHead className="px-4 py-2.5 font-medium">
              {t("elecPhases.name")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("elecPhases.order")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("elecPhases.progressRatio")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("elecPhases.status")}
            </TableHead>
            {showReorder && (
              <TableHead className="px-4 py-2.5 font-medium">
                {t("elecPhases.reorder")}
              </TableHead>
            )}
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
            rows.map((row) => {
              const globalIndex = orderIndexById.get(row.id)
              const atStart = globalIndex === 0
              const atEnd =
                globalIndex === undefined || globalIndex >= orderTotal - 1
              return (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="px-4 py-3 font-medium" dir="auto">
                    {row.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {row.sortOrder}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {row.progressRatio}%
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge tone={statusTone(row.status)}>
                      {t(`elecPhases.statusLabels.${row.status}`)}
                    </Badge>
                  </TableCell>
                  {showReorder && (
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          icon="sortAsc"
                          aria-label={t("elecPhases.moveUp", {
                            name: row.name,
                          })}
                          disabled={
                            !canReorder ||
                            reorderPending ||
                            atStart ||
                            globalIndex === undefined
                          }
                          onClick={() => onMoveUp(row)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          icon="sortDesc"
                          aria-label={t("elecPhases.moveDown", {
                            name: row.name,
                          })}
                          disabled={
                            !canReorder ||
                            reorderPending ||
                            atEnd ||
                            globalIndex === undefined
                          }
                          onClick={() => onMoveDown(row)}
                        />
                      </div>
                    </TableCell>
                  )}
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
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
