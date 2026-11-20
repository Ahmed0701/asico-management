import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import {
  majorStringToMinorUnits,
  minorUnitsToMajorString,
} from "@/features/villas/api/budget"
import { toApiError } from "@/shared/api/errors"
import { idempotencyWrite, useIdempotencyKey } from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Input, Select } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import {
  OVERHEAD_ROLES,
  useCreateOverheadMutation,
  useUpdateOverheadMutation,
  type OverheadEmployee,
  type OverheadInput,
  type OverheadRole,
  type OverheadUpdate,
} from "../api"

const MAX_SALARY_MINOR = 999_999_999_999
const MAX_TEXT = 120

type Values = {
  name: string
  /** Empty until one is picked. */
  role: OverheadRole | ""
  salary: string
}

type Errors = Partial<Record<keyof Values, string>>

type Props = {
  /** The employee to change; none to add one. */
  employee?: OverheadEmployee
  onClose: () => void
}

function valuesOf(employee?: OverheadEmployee): Values {
  return employee
    ? {
        name: employee.name,
        role: employee.role,
        salary: minorUnitsToMajorString(employee.salaryMinor, "KWD"),
      }
    : { name: "", role: "", salary: "" }
}

function check(values: Values): Errors {
  const errors: Errors = {}
  const name = values.name.trim()
  const salary = majorStringToMinorUnits(values.salary.trim(), "KWD")
  if (name === "" || name.length > MAX_TEXT)
    errors.name = "overhead.nameInvalid"
  if (values.role === "") errors.role = "overhead.roleInvalid"
  if (salary === null || salary < 0 || salary > MAX_SALARY_MINOR) {
    errors.salary = "overhead.salaryInvalid"
  }
  return errors
}

/** Adds an overhead employee, or changes one: the name, the role and the monthly salary in KWD. */
export default function OverheadFormModal({ employee, onClose }: Props) {
  const { t } = useTranslation()
  const create = useCreateOverheadMutation()
  const update = useUpdateOverheadMutation()
  const idempotency = useIdempotencyKey()
  const [values, setValues] = useState<Values>(() => valuesOf(employee))
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = check(values)
    setErrors(found)
    const salaryMinor = majorStringToMinorUnits(values.salary.trim(), "KWD")
    if (
      Object.keys(found).length > 0 ||
      salaryMinor === null ||
      values.role === ""
    ) {
      return
    }
    const input: OverheadInput = {
      name: values.name.trim(),
      role: values.role,
      salaryMinor,
    }
    setFormError(null)
    try {
      if (employee) {
        // Only what changed is sent.
        const patch: OverheadUpdate = {}
        if (input.name !== employee.name) patch.name = input.name
        if (input.role !== employee.role) patch.role = input.role
        if (input.salaryMinor !== employee.salaryMinor) {
          patch.salaryMinor = input.salaryMinor
        }
        if (Object.keys(patch).length > 0) {
          await update.mutateAsync({
            id: employee.id,
            input: patch,
            version: employee.version,
          })
          toast.success(t("overhead.saved"))
        }
      } else {
        await create.mutateAsync({
          input,
          write: idempotencyWrite(idempotency.getKey()),
        })
        idempotency.resetKey()
        toast.success(t("overhead.added"))
      }
      onClose()
    } catch (err) {
      idempotency.markRejected()
      setFormError(toApiError(err).message)
    }
  }

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={employee ? t("overhead.editTitle") : t("overhead.addTitle")}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="overhead-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="overhead-form" className="grid gap-4" onSubmit={submit}>
        <Input
          label={t("overhead.name")}
          value={values.name}
          onChange={(e) => set("name")(e.target.value)}
          error={errors.name}
          maxLength={MAX_TEXT}
          dir="auto"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("overhead.role")}
            value={values.role}
            onChange={(e) => set("role")(e.target.value)}
            error={errors.role}
            placeholder={t("overhead.rolePlaceholder")}
            options={OVERHEAD_ROLES.map((role) => ({
              value: role,
              label: t(`overhead.roles.${role}`),
            }))}
          />
          <Input
            label={t("overhead.salaryKwd")}
            inputMode="decimal"
            value={values.salary}
            onChange={(e) => set("salary")(e.target.value)}
            error={errors.salary}
            placeholder="0.000"
            dir="ltr"
          />
        </div>
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
