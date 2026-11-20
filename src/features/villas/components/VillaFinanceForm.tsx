import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Input } from "@/shared/ui/Field"
import {
  formatBudgetDisplay,
  majorStringToMinorUnits,
  minorUnitsToMajorString,
} from "../api/budget"
import {
  formatSharePercent,
  parseSharePercent,
  salariesOfShare,
  useSaveVillaFinanceMutation,
  type FinanceField,
  type VillaFinance,
  type VillaFinanceInput,
} from "../api/villa-finance"

const MAX_MINOR = 999_999_999_999

// The amounts typed in KWD: the budget first, then three costs. The salaries are a share of the Department Overhead.
const AMOUNTS = [
  "budgetMinor",
  "workOrderMinor",
  "materialsMinor",
  "pettyCashMinor",
] as const
type Amount = typeof AMOUNTS[number]
type Editable = Amount | "salaryShare"

export const FINANCE_LABEL_KEYS: Record<FinanceField | "budgetMinor", string> =
  {
    budgetMinor: "villas.finance.budget",
    workOrderMinor: "villas.finance.workOrder",
    salariesMinor: "villas.finance.salaries",
    materialsMinor: "villas.finance.materials",
    pettyCashMinor: "villas.finance.pettyCash",
    expensesMinor: "villas.finance.expenses",
  }

const textOf = (minor: number | null) =>
  minor === null ? "" : minorUnitsToMajorString(minor, "KWD")

type Props = {
  finance: VillaFinance
  onDone: () => void
}

/**
 * Edits a villa's money: its budget and three costs in KWD, and its share (a percentage) of the Department Overhead
 * monthly salaries, which gives its salaries. Only what changed is sent; an empty field clears it. The variation orders
 * are not typed here: they come from the villa's Variation Orders.
 */
export default function VillaFinanceForm({ finance, onDone }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const save = useSaveVillaFinanceMutation()
  const [draft, setDraft] = useState<Record<Editable, string>>(() => ({
    budgetMinor:
      finance.currency === null || finance.currency === "KWD"
        ? textOf(finance.budgetMinor)
        : "",
    workOrderMinor: textOf(finance.workOrderMinor),
    materialsMinor: textOf(finance.materialsMinor),
    pettyCashMinor: textOf(finance.pettyCashMinor),
    salaryShare:
      finance.salaryShareBp === null
        ? ""
        : formatSharePercent(finance.salaryShareBp),
  }))
  const [errors, setErrors] = useState<Partial<Record<Editable, string>>>({})
  // A budget kept in another currency is shown, and replaced (in KWD) only if one is typed.
  const foreignBudget =
    finance.budgetMinor !== null &&
    finance.currency !== null &&
    finance.currency !== "KWD"
  const typedShare = parseSharePercent(draft.salaryShare.trim())
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)

  const change = (field: Editable) => (value: string) => {
    setDraft((d) => ({ ...d, [field]: value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const input: VillaFinanceInput = {}
    const found: Partial<Record<Editable, string>> = {}
    for (const field of AMOUNTS) {
      const text = draft[field].trim()
      const value = text === "" ? null : majorStringToMinorUnits(text, "KWD")
      if (text !== "" && (value === null || value > MAX_MINOR)) {
        found[field] = "villas.finance.amountInvalid"
        continue
      }
      if (field === "budgetMinor" && foreignBudget && text === "") continue
      if (value !== finance[field]) input[field] = value
    }
    const shareText = draft.salaryShare.trim()
    if (shareText !== "" && typedShare === null) {
      found.salaryShare = "villas.finance.shareInvalid"
    } else {
      const share = shareText === "" ? null : typedShare
      if (share !== finance.salaryShareBp) input.salaryShareBp = share
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return
    if (Object.keys(input).length === 0) {
      onDone()
      return
    }
    try {
      await save.mutateAsync({
        villaId: finance.villaId,
        input,
        version: finance.version,
      })
      toast.success(t("villas.finance.saved"))
      onDone()
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const amountInput = (field: Amount) => (
    <Input
      key={field}
      label={`${t(FINANCE_LABEL_KEYS[field])} (${t("villas.finance.kwd")})`}
      inputMode="decimal"
      placeholder="0.000"
      dir="ltr"
      value={draft[field]}
      error={errors[field]}
      onChange={(e) => change(field)(e.target.value)}
    />
  )

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {foreignBudget && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {t("villas.finance.foreignBudget", {
            budget: formatBudgetDisplay(
              finance.budgetMinor,
              finance.currency,
              locale,
            ),
          })}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {amountInput("budgetMinor")}
        {amountInput("workOrderMinor")}
        <div>
          <Input
            label={t("villas.finance.salaryShare")}
            inputMode="decimal"
            placeholder="0"
            dir="ltr"
            value={draft.salaryShare}
            error={errors.salaryShare}
            onChange={(e) => change("salaryShare")(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("villas.finance.shareHint", {
              amount: kwd(
                salariesOfShare(finance.overheadSalariesMinor, typedShare) ?? 0,
              ),
              total: kwd(finance.overheadSalariesMinor),
            })}
          </p>
        </div>
        {amountInput("materialsMinor")}
        {amountInput("pettyCashMinor")}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("villas.finance.formHint", {
          amount: kwd(finance.variationOrdersMinor),
        })}{" "}
        {t("villas.finance.expensesHint", {
          amount: kwd(finance.expensesMinor),
        })}
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onDone} disabled={save.isPending}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" variant="primary" disabled={save.isPending}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  )
}
