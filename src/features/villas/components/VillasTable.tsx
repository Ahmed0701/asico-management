import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import i18n from "@/shared/i18n"
import { IconButton } from "@/shared/ui/Button"
import { RowActions } from "@/shared/ui/DataTable"
import ProgressCell from "@/shared/list/ProgressCell"
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
import type { VillaListItem } from "../api"

function formatDate(iso: string | null): string {
  if (!iso) return "-"
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(`${iso}T00:00:00.000Z`),
  )
}

export default function VillasTable({
  rows,
  isLoading,
  canUpdate,
  canDelete,
  canLinkDetail,
  onEdit,
  onDelete,
}: {
  rows: VillaListItem[]
  isLoading: boolean
  canUpdate: boolean
  canDelete: boolean
  canLinkDetail: boolean
  onEdit: (row: VillaListItem) => void
  onDelete: (row: VillaListItem) => void
}) {
  const { t } = useTranslation()
  const colCount = 9 + (canUpdate || canDelete ? 1 : 0)
  const showActions = canUpdate || canDelete

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <TableHead className="px-4 py-2.5">
              {t("villas.villaNumber")}
            </TableHead>
            <TableHead className="px-4 py-2.5">{t("villas.owner")}</TableHead>
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
            <TableHead className="px-4 py-2.5">
              {t("villas.progress")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villas.targetDate")}
            </TableHead>
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
              <TableRow key={row.id} className="hover:bg-muted/40">
                <TableCell className="px-4 py-3 font-medium tabular-nums">
                  {canLinkDetail ? (
                    <Link to={`/villas/${row.id}`} className="hover:underline">
                      {row.villaNumber}
                    </Link>
                  ) : (
                    row.villaNumber
                  )}
                </TableCell>
                <TableCell className="px-4 py-3" dir="auto">
                  {row.ownerName ?? "-"}
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
                  {row.location}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  {row.electricalEngineer?.name ?? "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  {row.civilEngineer.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  {row.contractor?.name ?? "-"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ProgressCell value={row.progress} />
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">
                  {formatDate(row.targetDate)}
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
