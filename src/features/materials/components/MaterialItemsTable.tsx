import { useTranslation } from "react-i18next"
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
import type { MaterialItem } from "../api"

type Props = {
  rows: MaterialItem[]
  loading: boolean
  canEdit: boolean
  onEdit: (item: MaterialItem) => void
  onDelete: (item: MaterialItem) => void
}

/** The materials list: name, type, unit, how much every villa needs, and how many delivery lines use each one. */
export default function MaterialItemsTable({
  rows,
  loading,
  canEdit,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const columnCount = canEdit ? 6 : 5

  return (
    <div className="list-surface overflow-x-auto">
      <Table className="min-w-160">
        <TableHeader>
          <TableRow className="list-head-row">
            <TableHead className="px-4 py-2.5">
              {t("materials.items.name")}
            </TableHead>
            <TableHead className="px-4 py-2.5">{t("materials.type")}</TableHead>
            <TableHead className="px-4 py-2.5">
              {t("materials.items.unit")}
            </TableHead>
            <TableHead className="px-4 py-2.5 text-end">
              {t("materials.items.required")}
            </TableHead>
            <TableHead className="px-4 py-2.5 text-end">
              {t("materials.items.used")}
            </TableHead>
            {canEdit && (
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
                className="list-empty px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {t("materials.items.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-4 py-3 text-sm font-medium" dir="auto">
                  {item.name}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge tone={item.type === "SWITCHGEAR" ? "info" : "warn"}>
                    {t(`materials.types.${item.type}`)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  {item.unit}
                </TableCell>
                <TableCell className="px-4 py-3 text-end text-sm tabular-nums">
                  {item.requiredPerVilla === 0 ? (
                    <span className="text-muted-foreground">
                      {t("materials.items.notNeeded")}
                    </span>
                  ) : (
                    `${item.requiredPerVilla.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${item.unit}`
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-end text-sm tabular-nums text-muted-foreground">
                  {t("materials.lineCount", { count: item.lineCount })}
                </TableCell>
                {canEdit && (
                  <TableCell className="px-4 py-3">
                    <RowActions>
                      <IconButton
                        icon="edit"
                        label={t("materials.items.editOf", { name: item.name })}
                        onClick={() => onEdit(item)}
                      />
                      <IconButton
                        icon="trash"
                        variant="danger"
                        label={t("materials.items.deleteOf", {
                          name: item.name,
                        })}
                        disabled={item.lineCount > 0}
                        title={
                          item.lineCount > 0
                            ? t("materials.items.inUse")
                            : undefined
                        }
                        onClick={() => onDelete(item)}
                      />
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
