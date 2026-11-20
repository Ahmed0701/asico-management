import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Input } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import { useSetMaterialOrderMutation, type MaterialOrder } from "../api"

type Props = {
  order: MaterialOrder
  onClose: () => void
}

/**
 * The MR, PO and due dates of one villa's switchgear or cables. Each can be left empty; the PO cannot be before the MR.
 * The dates on the delivery notes are offered when none is entered yet.
 */
export default function OrderDatesModal({ order, onClose }: Props) {
  const { t } = useTranslation()
  const save = useSetMaterialOrderMutation()
  const [mrDate, setMrDate] = useState(
    order.mrDate ?? order.deliveryMrDate ?? "",
  )
  const [poDate, setPoDate] = useState(
    order.poDate ?? order.deliveryPoDate ?? "",
  )
  const [dueDate, setDueDate] = useState(order.dueDate ?? "")
  const [poError, setPoError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (mrDate && poDate && poDate < mrDate) {
      setPoError("materials.orders.poBeforeMrMessage")
      return
    }
    setPoError(undefined)
    setFormError(null)
    try {
      await save.mutateAsync({
        villaId: order.villa.id,
        type: order.type,
        dates: {
          mrDate: mrDate || null,
          poDate: poDate || null,
          dueDate: dueDate || null,
        },
      })
      toast.success(
        t("materials.orders.saved", { name: order.villa.villaNumber }),
      )
      onClose()
    } catch (err) {
      setFormError(toApiError(err).message)
    }
  }

  return (
    <Modal
      open
      size="sm"
      onClose={save.isPending ? () => {} : onClose}
      title={t("materials.orders.editTitle", {
        name: order.villa.villaNumber,
        type: t(`materials.types.${order.type}`),
      })}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={save.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="order-dates-form"
            variant="primary"
            disabled={save.isPending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="order-dates-form" className="grid gap-4" onSubmit={submit}>
        <Input
          label={t("materials.orders.mrDate")}
          type="date"
          value={mrDate}
          onChange={(e) => setMrDate(e.target.value)}
        />
        <Input
          label={t("materials.orders.poDate")}
          type="date"
          value={poDate}
          onChange={(e) => {
            setPoDate(e.target.value)
            setPoError(undefined)
          }}
          error={poError}
        />
        <Input
          label={t("materials.orders.dueDate")}
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t("materials.orders.datesHint")}
        </p>
        {formError && (
          <p
            role="alert"
            className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
