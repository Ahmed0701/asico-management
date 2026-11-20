import { useTranslation } from "react-i18next"
import { Cable, Zap, type LucideIcon } from "lucide-react"
import type { FactoryType } from "@/features/materials/api"
import { VillaCell } from "@/shared/list/cells"
import SortableHead from "@/shared/list/SortableHead"
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
import type { AssignedFactory, VillaVendors } from "../api"

const ICONS: Record<FactoryType, LucideIcon> = { SWITCHGEAR: Zap, CABLE: Cable }

type FactoryCellProps = {
  type: FactoryType
  assigned: AssignedFactory | null
}

/** The villa's factory of one type, or "Not assigned". */
function FactoryCell({ type, assigned }: FactoryCellProps) {
  const { t } = useTranslation()
  const TypeIcon = ICONS[type]
  if (!assigned) {
    return (
      <span className="text-sm text-muted-foreground">
        {t("vendors.notAssigned")}
      </span>
    )
  }
  return (
    <span
      className={
        type === "SWITCHGEAR"
          ? "inline-flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/5 px-2.5 py-1 text-sm font-medium"
          : "inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2.5 py-1 text-sm font-medium"
      }
    >
      <TypeIcon
        size={14}
        aria-hidden
        className={type === "SWITCHGEAR" ? "text-sky-600" : "text-amber-600"}
      />
      <span dir="auto">{assigned.name}</span>
    </span>
  )
}

type Props = {
  rows: VillaVendors[]
  loading: boolean
  sort: string | undefined
  onSort: (next: string | undefined) => void
  canEdit: boolean
  onEdit: (row: VillaVendors) => void
  onRemove: (row: VillaVendors) => void
}

/** Each villa with its assigned switchgear factory and cable factory; assigned from a form opened on the row. */
export default function VillaVendorsTable({
  rows,
  loading,
  sort,
  onSort,
  canEdit,
  onEdit,
  onRemove,
}: Props) {
  const { t } = useTranslation()
  const columnCount = canEdit ? 4 : 3

  return (
    <div className="list-surface overflow-x-auto">
      <Table className="min-w-180">
        <TableHeader>
          <TableRow className="list-head-row">
            <SortableHead
              label={t("vendors.villa")}
              field="villaNumber"
              sort={sort}
              onSort={onSort}
            />
            <TableHead className="px-4 py-2.5">
              {t("vendors.switchgear")}
            </TableHead>
            <TableHead className="px-4 py-2.5">{t("vendors.cable")}</TableHead>
            {canEdit && (
              <TableHead className="px-4 py-2.5">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            <TableBodySkeleton columns={columnCount} rows={8} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="list-empty px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {t("vendors.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.villa.id}
                tone={!row.switchgear && !row.cable ? "warn" : undefined}
              >
                <TableCell className="px-4 py-3">
                  <VillaCell
                    id={row.villa.id}
                    villaNumber={row.villa.villaNumber}
                    sub={row.villa.location}
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <FactoryCell type="SWITCHGEAR" assigned={row.switchgear} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <FactoryCell type="CABLE" assigned={row.cable} />
                </TableCell>
                {canEdit && (
                  <TableCell className="px-4 py-3">
                    <RowActions>
                      <IconButton
                        icon="edit"
                        label={t("vendors.assignOf", {
                          name: row.villa.villaNumber,
                        })}
                        onClick={() => onEdit(row)}
                      />
                      <IconButton
                        icon="trash"
                        variant="danger"
                        label={t("vendors.removeOf", {
                          name: row.villa.villaNumber,
                        })}
                        onClick={() => onRemove(row)}
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
