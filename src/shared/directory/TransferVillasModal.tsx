import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ArrowRightLeft, Building2 } from "lucide-react"
import Modal from "@/shared/ui/Modal"
import Button from "@/shared/ui/Button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { SearchSelect } from "@/shared/ui/search-select"

export type TransferVillasTarget = { id: string; name: string }

type FormValues = { toEngineerId: string }

type Props = {
  /** The engineer whose villas move; null keeps the dialog closed. */
  from: { id: string; name: string; villaCount: number } | null
  /** The engineers that can take the villas (the active ones); the engineer itself is left out here. */
  targets: TransferVillasTarget[]
  targetsLoading?: boolean
  pending?: boolean
  /** The server's refusal, shown above the form. */
  error?: string | null
  onClose: () => void
  onConfirm: (toEngineerId: string) => void
}

/**
 * Moves every villa of an engineer to another engineer, all at once, so the engineer can then be deleted. Shared by the
 * civil and the electrical engineers lists.
 */
export default function TransferVillasModal(props: Props) {
  if (!props.from) return null
  return <Inner key={props.from.id} {...props} from={props.from} />
}

function Inner({
  from,
  targets,
  targetsLoading,
  pending,
  error,
  onClose,
  onConfirm,
}: Props & { from: NonNullable<Props["from"]> }) {
  const { t } = useTranslation()
  const form = useForm<FormValues>({ defaultValues: { toEngineerId: "" } })
  const options = targets
    .filter((target) => target.id !== from.id)
    .map((target) => ({ value: target.id, label: target.name }))
  const close = pending ? () => {} : onClose

  return (
    <Modal
      open
      onClose={close}
      size="sm"
      title={t("directory.transferVillas.title")}
      description={t("directory.transferVillas.subtitle", { name: from.name })}
      footer={
        <>
          <Button type="button" disabled={pending} onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="transfer-villas-form"
            variant="primary"
            disabled={pending || options.length === 0}
          >
            <ArrowRightLeft size={14} aria-hidden />
            {t("directory.transferVillas.confirm", { count: from.villaCount })}
          </Button>
        </>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft p-3 text-sm text-danger"
        >
          {error}
        </div>
      )}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-progress-soft text-progress">
          <Building2 size={16} aria-hidden />
        </span>
        <span className="grid min-w-0">
          <span className="truncate text-sm font-semibold" dir="auto">
            {from.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("directory.transferVillas.count", { count: from.villaCount })}
          </span>
        </span>
      </div>
      <Form {...form}>
        <form
          id="transfer-villas-form"
          noValidate
          className="space-y-4"
          onSubmit={form.handleSubmit((values) =>
            onConfirm(values.toEngineerId),
          )}
        >
          <FormField
            control={form.control}
            name="toEngineerId"
            rules={{ required: t("directory.transferVillas.targetRequired") }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("directory.transferVillas.target")}</FormLabel>
                <FormControl>
                  <SearchSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={options}
                    loading={targetsLoading}
                    disabled={pending}
                    placeholder={t(
                      "directory.transferVillas.targetPlaceholder",
                    )}
                    aria-label={t("directory.transferVillas.target")}
                  />
                </FormControl>
                <FormDescription>
                  {!targetsLoading && options.length === 0
                    ? t("directory.transferVillas.noTargets")
                    : t("directory.transferVillas.hint")}
                </FormDescription>
                <FormMessage className="text-red-500 text-[10px]" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Modal>
  )
}
