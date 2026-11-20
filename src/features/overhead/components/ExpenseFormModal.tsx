import { useRef, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import {
  majorStringToMinorUnits,
  minorUnitsToMajorString,
} from "@/features/villas/api/budget"
import { useVillaOptionsQuery } from "@/features/villas/api"
import { toApiError } from "@/shared/api/errors"
import { idempotencyWrite, useIdempotencyKey } from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { FormField, Input, Select, Textarea } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import { SearchSelect } from "@/shared/ui/search-select"
import {
  EXPENSE_TYPES,
  MAX_EXPENSE_FILES,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useUploadExpenseFilesMutation,
  type ExpenseType,
  type OverheadExpense,
  type OverheadExpenseInput,
  type OverheadExpenseUpdate,
} from "../api"

const MAX_AMOUNT_MINOR = 999_999_999_999
/** The invoice files the server takes: PDF and photos. */
export const EXPENSE_FILE_ACCEPT = "application/pdf,image/jpeg,image/png"

type Values = {
  villaId: string
  type: ExpenseType | ""
  description: string
  amount: string
  expenseDate: string
  invoiceNumber: string
}

type Errors = Partial<Record<keyof Values, string>>

type Props = {
  /** The expense to change; none to add one. */
  expense?: OverheadExpense
  onClose: () => void
}

// Today on this computer, YYYY-MM-DD.
function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function valuesOf(expense?: OverheadExpense): Values {
  return expense
    ? {
        villaId: expense.villa.id,
        type: expense.type,
        description: expense.description,
        amount: minorUnitsToMajorString(expense.amountMinor, "KWD"),
        expenseDate: expense.expenseDate,
        invoiceNumber: expense.invoiceNumber ?? "",
      }
    : {
        villaId: "",
        type: "",
        description: "",
        amount: "",
        expenseDate: today(),
        invoiceNumber: "",
      }
}

function check(values: Values): Errors {
  const errors: Errors = {}
  const amount = majorStringToMinorUnits(values.amount.trim(), "KWD")
  const description = values.description.trim()
  if (!values.villaId) errors.villaId = "overhead.expenses.villaInvalid"
  if (!values.type) errors.type = "overhead.expenses.typeInvalid"
  if (description === "" || description.length > 500) {
    errors.description = "overhead.expenses.descriptionInvalid"
  }
  if (amount === null || amount < 0 || amount > MAX_AMOUNT_MINOR) {
    errors.amount = "overhead.expenses.amountInvalid"
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.expenseDate)) {
    errors.expenseDate = "overhead.expenses.dateInvalid"
  }
  if (values.invoiceNumber.trim().length > 60) {
    errors.invoiceNumber = "overhead.expenses.invoiceNumberInvalid"
  }
  return errors
}

/**
 * Adds an additional expense for a villa, or changes one: villa, type, description, amount in KWD, date and invoice
 * number. When adding, invoice files (PDF or photos) can be picked too; they are uploaded once the expense is saved.
 */
export default function ExpenseFormModal({ expense, onClose }: Props) {
  const { t } = useTranslation()
  const villas = useVillaOptionsQuery()
  const create = useCreateExpenseMutation()
  const update = useUpdateExpenseMutation()
  const upload = useUploadExpenseFilesMutation()
  const idempotency = useIdempotencyKey()
  const fileInput = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<Values>(() => valuesOf(expense))
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending || upload.isPending

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = check(values)
    setErrors(found)
    const amountMinor = majorStringToMinorUnits(values.amount.trim(), "KWD")
    if (Object.keys(found).length > 0 || amountMinor === null || !values.type) {
      return
    }
    const input: OverheadExpenseInput = {
      villaId: values.villaId,
      type: values.type,
      description: values.description.trim(),
      amountMinor,
      expenseDate: values.expenseDate,
      invoiceNumber: values.invoiceNumber.trim() || null,
    }
    setFormError(null)
    try {
      if (expense) {
        // Only what changed is sent.
        const before: OverheadExpenseInput = {
          villaId: expense.villa.id,
          type: expense.type,
          description: expense.description,
          amountMinor: expense.amountMinor,
          expenseDate: expense.expenseDate,
          invoiceNumber: expense.invoiceNumber,
        }
        const patch: OverheadExpenseUpdate = {}
        for (const key of Object.keys(
          input,
        ) as Array<keyof OverheadExpenseInput>) {
          if (input[key] !== before[key]) {
            ;(patch as Record<string, unknown>)[key] = input[key]
          }
        }
        if (Object.keys(patch).length > 0) {
          await update.mutateAsync({
            id: expense.id,
            input: patch,
            version: expense.version,
          })
          toast.success(t("overhead.expenses.saved"))
        }
        onClose()
        return
      }
      const created = await create.mutateAsync({
        input,
        write: idempotencyWrite(idempotency.getKey()),
      })
      idempotency.resetKey()
      if (files.length > 0) {
        try {
          await upload.mutateAsync({ id: created.id, files })
        } catch (err) {
          // The expense is kept; the files can be added again from its files.
          toast.error(
            t("overhead.expenses.filesFailed", {
              message: toApiError(err).message,
            }),
          )
          onClose()
          return
        }
      }
      toast.success(t("overhead.expenses.added"))
      onClose()
    } catch (err) {
      idempotency.markRejected()
      setFormError(toApiError(err).message)
    }
  }

  const pickFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    if (fileInput.current) fileInput.current.value = ""
    setFiles((current) => [...current, ...picked].slice(0, MAX_EXPENSE_FILES))
  }

  const villaOptions = (villas.data ?? []).map((v) => ({
    value: v.id,
    label: v.villaNumber,
  }))

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={
        expense
          ? t("overhead.expenses.editTitle")
          : t("overhead.expenses.addTitle")
      }
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="expense-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="expense-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t("overhead.expenses.villa")}
            error={errors.villaId}
            htmlFor="expense-villa"
          >
            <SearchSelect
              id="expense-villa"
              value={values.villaId}
              onChange={set("villaId")}
              options={villaOptions}
              loading={villas.isLoading}
              placeholder={t("overhead.expenses.pickVilla")}
              aria-invalid={!!errors.villaId}
            />
          </FormField>
          <Select
            label={t("overhead.expenses.type")}
            value={values.type}
            onChange={(e) => set("type")(e.target.value)}
            error={errors.type}
            placeholder={t("overhead.expenses.pickType")}
            options={EXPENSE_TYPES.map((type) => ({
              value: type,
              label: t(`overhead.expenses.types.${type}`),
            }))}
          />
          <Input
            label={t("overhead.expenses.amountKwd")}
            inputMode="decimal"
            value={values.amount}
            onChange={(e) => set("amount")(e.target.value)}
            error={errors.amount}
            placeholder="0.000"
            dir="ltr"
          />
          <Input
            label={t("overhead.expenses.date")}
            type="date"
            value={values.expenseDate}
            onChange={(e) => set("expenseDate")(e.target.value)}
            error={errors.expenseDate}
          />
          <Input
            label={t("overhead.expenses.invoiceNumber")}
            value={values.invoiceNumber}
            onChange={(e) => set("invoiceNumber")(e.target.value)}
            error={errors.invoiceNumber}
            maxLength={60}
            dir="auto"
          />
        </div>
        <Textarea
          label={t("overhead.expenses.description")}
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          error={errors.description}
          maxLength={500}
          dir="auto"
        />
        {!expense && (
          <div className="grid gap-2">
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={EXPENSE_FILE_ACCEPT}
              className="hidden"
              data-testid="expense-files-input"
              onChange={(e) => pickFiles(e.target.files)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                icon="upload"
                disabled={pending || files.length >= MAX_EXPENSE_FILES}
                onClick={() => fileInput.current?.click()}
              >
                {t("overhead.expenses.attachFiles")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("overhead.expenses.filesHint", { count: MAX_EXPENSE_FILES })}
              </span>
            </div>
            {files.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-2 px-3 py-1.5"
                  >
                    <span className="min-w-0 truncate" dir="auto">
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      {t("overhead.expenses.removePicked")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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
