import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"
import {
  FACTORY_TYPES,
  useItemsQuery,
  useSetRequirementsMutation,
  type MaterialTotal,
} from "../api"

/**
 * What one villa needs of each catalog material. A blank box means the catalog's quantity; a number is this villa's own.
 */
export default function RequirementsModal({
  open,
  villaId,
  current,
  onClose,
}: {
  open: boolean
  villaId: string
  current: MaterialTotal[]
  onClose: () => void
}) {
  if (!open) return null
  return <Inner villaId={villaId} current={current} onClose={onClose} />
}

function Inner({
  villaId,
  current,
  onClose,
}: {
  villaId: string
  current: MaterialTotal[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const catalog = useItemsQuery()
  const save = useSetRequirementsMutation()
  // The villa's own quantities, as typed; an item missing here follows the catalog.
  const [own, setOwn] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      current
        .filter((m) => m.custom)
        .map((m) => [m.itemId, String(m.required)]),
    ),
  )
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    const items = (catalog.data ?? []).map((item) => {
      const text = (own[item.id] ?? "").trim()
      return { itemId: item.id, quantity: text === "" ? null : Number(text) }
    })
    const bad = items.some(
      (row) =>
        row.quantity !== null &&
        (!(row.quantity >= 0) ||
          Math.round(row.quantity * 100) !== row.quantity * 100),
    )
    if (bad) {
      setError(t("materials.errors.required"))
      return
    }
    try {
      await save.mutateAsync({ villaId, items })
      toast.success(t("materials.requirementsSaved"))
      onClose()
    } catch (err) {
      setError(toApiError(err).message)
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={save.isPending ? () => {} : onClose}
      title={t("materials.requirementsTitle")}
      description={t("materials.requirementsHelp")}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={save.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={save.isPending || !catalog.data?.length}
            onClick={() => void submit()}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {FACTORY_TYPES.map((group) => {
          const items = (catalog.data ?? []).filter((i) => i.type === group)
          if (items.length === 0) return null
          return (
            <section key={group} className="grid gap-2">
              <h3 className="text-sm font-semibold">
                {t(`materials.typesPlural.${group}`)}
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <label
                      htmlFor={`req-${item.id}`}
                      className="min-w-0 text-sm"
                      dir="auto"
                    >
                      {item.name}
                    </label>
                    <span className="flex items-center gap-1.5">
                      <input
                        id={`req-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={String(item.requiredPerVilla)}
                        value={own[item.id] ?? ""}
                        onChange={(e) =>
                          setOwn((o) => ({ ...o, [item.id]: e.target.value }))
                        }
                        className="h-8 w-20 rounded-md border border-border bg-background px-2 text-end text-sm tabular-nums placeholder:text-muted-foreground/60"
                      />
                      <span className="w-8 text-xs text-muted-foreground">
                        {item.unit}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
