import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useFactoriesQuery } from "@/features/materials/api"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { FormField, Select } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import { SearchSelect } from "@/shared/ui/search-select"
import {
  useAddVendorVillaMutation,
  useAssignVillaVendorsMutation,
  useAvailableVendorVillasQuery,
  type AssignedFactory,
  type VillaVendors,
  type VillaVendorsInput,
} from "../api"

type Props = {
  /** The villa to assign; none to add a villa to the list. */
  row?: VillaVendors
  onClose: () => void
}

type Values = {
  villaId: string
  switchgearFactoryId: string
  cableFactoryId: string
}

/**
 * Assigns a villa its switchgear factory and its cable factory. Without a villa, it first adds one picked from the
 * villas not on the list yet. "Not assigned" takes a factory off.
 */
export default function VendorFormModal({ row, onClose }: Props) {
  const { t } = useTranslation()
  const factories = useFactoriesQuery()
  const available = useAvailableVendorVillasQuery()
  const add = useAddVendorVillaMutation()
  const assign = useAssignVillaVendorsMutation()
  const [values, setValues] = useState<Values>({
    villaId: row?.villa.id ?? "",
    switchgearFactoryId: row?.switchgear?.id ?? "",
    cableFactoryId: row?.cable?.id ?? "",
  })
  const [villaError, setVillaError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const pending = add.isPending || assign.isPending

  // A factory renamed or deleted since the list was read still shows under its assigned name.
  const optionsOf = (
    type: "SWITCHGEAR" | "CABLE",
    assigned?: AssignedFactory | null,
  ) => {
    const options = (factories.data ?? [])
      .filter((factory) => factory.type === type)
      .map((factory) => ({ value: factory.id, label: factory.name }))
    if (assigned && !options.some((option) => option.value === assigned.id)) {
      options.unshift({ value: assigned.id, label: assigned.name })
    }
    return options
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!values.villaId) {
      setVillaError("vendors.villaRequired")
      return
    }
    setFormError(null)
    const switchgear = values.switchgearFactoryId || null
    const cable = values.cableFactoryId || null
    try {
      let version = row?.version
      if (!row) {
        version = (await add.mutateAsync(values.villaId)).version
      }
      // Only what changed is sent.
      const input: VillaVendorsInput = {}
      if (switchgear !== (row?.switchgear?.id ?? null)) {
        input.switchgearFactoryId = switchgear
      }
      if (cable !== (row?.cable?.id ?? null)) input.cableFactoryId = cable
      if (Object.keys(input).length > 0 && version !== undefined) {
        await assign.mutateAsync({ villaId: values.villaId, input, version })
      }
      const name =
        row?.villa.villaNumber ??
        available.data?.find((villa) => villa.id === values.villaId)
          ?.villaNumber ??
        ""
      toast.success(t(row ? "vendors.saved" : "vendors.villaAdded", { name }))
      onClose()
    } catch (err) {
      setFormError(toApiError(err).message)
    }
  }

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={
        row
          ? t("vendors.assignTitle", { name: row.villa.villaNumber })
          : t("vendors.addTitle")
      }
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="vendor-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="vendor-form" className="grid gap-4" onSubmit={submit}>
        {!row && (
          <FormField
            label={t("vendors.villa")}
            error={villaError}
            htmlFor="vendor-villa"
          >
            <SearchSelect
              id="vendor-villa"
              value={values.villaId}
              onChange={(villaId) => {
                setValues((v) => ({ ...v, villaId }))
                setVillaError(undefined)
              }}
              options={(available.data ?? []).map((villa) => ({
                value: villa.id,
                label: villa.villaNumber,
              }))}
              loading={available.isLoading}
              placeholder={t("vendors.pickVilla")}
              aria-invalid={!!villaError}
            />
          </FormField>
        )}
        <Select
          label={t("vendors.switchgear")}
          value={values.switchgearFactoryId}
          onChange={(e) =>
            setValues((v) => ({ ...v, switchgearFactoryId: e.target.value }))
          }
          placeholder={t("vendors.notAssigned")}
          options={optionsOf("SWITCHGEAR", row?.switchgear)}
        />
        <Select
          label={t("vendors.cable")}
          value={values.cableFactoryId}
          onChange={(e) =>
            setValues((v) => ({ ...v, cableFactoryId: e.target.value }))
          }
          placeholder={t("vendors.notAssigned")}
          options={optionsOf("CABLE", row?.cable)}
        />
        <p className="text-xs text-muted-foreground">{t("vendors.formHint")}</p>
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
