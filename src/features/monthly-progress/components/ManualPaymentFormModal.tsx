import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import {
  formatBudgetDisplay,
  majorStringToMinorUnits,
  minorUnitsToMajorString,
} from "@/features/villas/api/budget"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Input, Textarea } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import {
  useAddManualPaymentMutation,
  type ManualPaymentInput,
  type VillaPaymentHistoryItem,
} from "../api"

const MAX_AMOUNT_MINOR = 999_999_999_999

type Values = {
  paidOn: string
  ratio: string
  amount: string
  contractorId: string
  note: string
}

type Errors = Partial<Record<keyof Values, string>>

type Props = {
  villaId: string
  villaNumber: string
  /** The villa's payments, the latest first: the new one has to fit between them by date. */
  items: VillaPaymentHistoryItem[]
  /** KWD fils; null when not entered on the Villa Budget. */
  workOrderMinor: number | null
  onClose: () => void
}

// Today on this computer, YYYY-MM-DD.
function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * The ratios a payment on `day` has to fit between: more than the payment on or before that day, less than the next
 * one. The same rule the server checks.
 */
export function ratioBounds(
  items: VillaPaymentHistoryItem[],
  day: string,
): { from: number; to: number | null } {
  const start = new Date(`${day}T00:00:00.000Z`).getTime()
  const before = items.find((item) => new Date(item.paidAt).getTime() <= start)
  const after = [...items]
    .reverse()
    .find((item) => new Date(item.paidAt).getTime() > start)
  return { from: before?.ratio ?? 0, to: after?.ratio ?? null }
}

function parseRatio(text: string): number | null {
  const trimmed = text.trim()
  if (!/^\d{1,3}(\.\d)?$/.test(trimmed)) return null
  const value = Number(trimmed)
  return value >= 0.1 && value <= 100 ? value : null
}

/**
 * Enters a payment made to the villa's contractor before the system: its date, the progress it paid up to, the amount
 * actually paid (the Work Order Value share is suggested), the contractor (the villa's own when left empty) and a note.
 */
export default function ManualPaymentFormModal({
  villaId,
  villaNumber,
  items,
  workOrderMinor,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const add = useAddManualPaymentMutation()
  const [values, setValues] = useState<Values>({
    paidOn: today(),
    ratio: "",
    amount: "",
    contractorId: "",
    note: "",
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(values.paidOn)
  const bounds = validDay ? ratioBounds(items, values.paidOn) : null
  const ratio = parseRatio(values.ratio)
  // What the progress since the payment before it is worth at the Work Order Value.
  const suggestedMinor =
    bounds && ratio !== null && ratio > bounds.from && workOrderMinor !== null
      ? Math.round((workOrderMinor * (ratio - bounds.from)) / 100)
      : null

  const ratioHint = bounds
    ? bounds.to === null
      ? t("villaPayments.manual.ratioAfter", { from: bounds.from })
      : t("villaPayments.manual.ratioBetween", {
          from: bounds.from,
          to: bounds.to,
        })
    : undefined

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Errors = {}
    const amountMinor = majorStringToMinorUnits(values.amount.trim(), "KWD")
    if (!validDay || values.paidOn > today()) {
      found.paidOn = "villaPayments.manual.dateInvalid"
    }
    if (
      ratio === null ||
      (bounds &&
        (ratio <= bounds.from || (bounds.to !== null && ratio >= bounds.to)))
    ) {
      found.ratio = "villaPayments.manual.ratioInvalid"
    }
    if (amountMinor === null || amountMinor < 0 || amountMinor > MAX_AMOUNT_MINOR) {
      found.amount = "villaPayments.manual.amountInvalid"
    }
    if (values.note.trim().length > 2000) {
      found.note = "villaPayments.manual.noteInvalid"
    }
    setErrors(found)
    if (Object.keys(found).length > 0 || ratio === null || amountMinor === null) {
      return
    }
    const input: ManualPaymentInput = {
      paidOn: values.paidOn,
      ratio,
      amountMinor,
      note: values.note.trim() || null,
    }
    if (values.contractorId) input.contractorId = values.contractorId
    setFormError(null)
    try {
      await add.mutateAsync({ villaId, input })
      toast.success(
        t("villaPayments.manual.added", {
          amount: formatBudgetDisplay(amountMinor, "KWD", locale),
          name: villaNumber,
        }),
      )
      onClose()
    } catch (err) {
      setFormError(toApiError(err).message)
    }
  }

  return (
    <Modal
      open
      onClose={add.isPending ? () => {} : onClose}
      title={t("villaPayments.manual.title", { name: villaNumber })}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={add.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="manual-payment-form"
            variant="primary"
            disabled={add.isPending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="manual-payment-form" className="grid gap-4" onSubmit={submit}>
        <p className="text-xs text-muted-foreground">
          {t("villaPayments.manual.intro")}
        </p>
        {workOrderMinor === null && (
          <p
            role="alert"
            className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
          >
            {t("villaPayments.manual.noWorkOrder")}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("villaPayments.manual.date")}
            type="date"
            max={today()}
            value={values.paidOn}
            onChange={(e) => set("paidOn")(e.target.value)}
            error={errors.paidOn}
          />
          <div className="grid gap-1">
            <Input
              label={t("villaPayments.manual.ratio")}
              inputMode="decimal"
              value={values.ratio}
              onChange={(e) => set("ratio")(e.target.value)}
              error={errors.ratio}
              placeholder="0.0"
              dir="ltr"
            />
            {ratioHint && !errors.ratio && (
              <p className="text-xs text-muted-foreground">{ratioHint}</p>
            )}
          </div>
          <div className="grid gap-1">
            <Input
              label={t("villaPayments.manual.amount")}
              inputMode="decimal"
              value={values.amount}
              onChange={(e) => set("amount")(e.target.value)}
              error={errors.amount}
              placeholder="0.000"
              dir="ltr"
            />
            {suggestedMinor !== null && (
              <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {t("villaPayments.manual.suggested", {
                  amount: formatBudgetDisplay(suggestedMinor, "KWD", locale),
                })}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-auto px-1 py-0 text-xs text-accent"
                  onClick={() =>
                    set("amount")(minorUnitsToMajorString(suggestedMinor, "KWD"))
                  }
                >
                  {t("villaPayments.manual.useSuggested")}
                </Button>
              </p>
            )}
          </div>
          <div className="grid gap-1">
            <ContractorSelect
              label={t("monthlyProgress.contractor")}
              value={values.contractorId}
              onChange={set("contractorId")}
            />
            <p className="text-xs text-muted-foreground">
              {t("villaPayments.manual.contractorHint")}
            </p>
          </div>
        </div>
        <Textarea
          label={t("villaPayments.manual.note")}
          value={values.note}
          onChange={(e) => set("note")(e.target.value)}
          error={errors.note}
          maxLength={2000}
          placeholder={t("villaPayments.manual.notePlaceholder")}
          dir="auto"
        />
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
