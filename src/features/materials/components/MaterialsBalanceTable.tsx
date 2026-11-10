import { useTranslation } from "react-i18next"
import type { MaterialTotal } from "../api"
import BalanceStatusBadge from "./BalanceStatusBadge"
import { formatQuantity } from "./DeliveriesTable"

/** A villa's materials: required (* when the villa has its own quantity), delivered from its delivery notes, and the balance. */
export default function MaterialsBalanceTable({
  materials,
}: {
  materials: MaterialTotal[]
}) {
  const { t } = useTranslation()
  if (materials.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
        {t("materials.villaNothingNeeded")}
      </p>
    )
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 text-xs text-muted-foreground">
            <th className="px-4 py-2 text-start font-medium">
              {t("materials.material")}
            </th>
            <th className="px-4 py-2 text-end font-medium">
              {t("materials.required")}
            </th>
            <th className="px-4 py-2 text-end font-medium">
              {t("materials.delivered")}
            </th>
            <th className="px-4 py-2 text-end font-medium">
              {t("materials.balance")}
            </th>
            <th className="px-4 py-2 text-end font-medium">
              {t("materials.notesCol")}
            </th>
            <th className="px-4 py-2 text-start font-medium">
              {t("materials.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {materials.map((row) => (
            <tr key={row.itemId} className="border-t border-border">
              <td className="px-4 py-2" dir="auto">
                {row.name}
                <span className="ms-2 text-xs text-muted-foreground">
                  {t(`materials.types.${row.type}`)}
                </span>
              </td>
              <td className="px-4 py-2 text-end tabular-nums">
                {formatQuantity(row.required, row.unit)}
                {row.custom && (
                  <span
                    className="ms-1 text-xs text-accent"
                    title={t("materials.customRequired")}
                  >
                    *
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-end tabular-nums">
                {formatQuantity(row.delivered, row.unit)}
              </td>
              <td className="px-4 py-2 text-end font-semibold tabular-nums">
                {formatQuantity(row.balance, row.unit)}
              </td>
              <td className="px-4 py-2 text-end tabular-nums">
                {row.withNote} / {row.deliveries}
              </td>
              <td className="px-4 py-2">
                <BalanceStatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
