import { useTranslation } from "react-i18next"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { DIRECTORY_EMAIL_API_ENABLED } from "@/shared/config/directoryEmail"
import { FormTextField } from "@/shared/ui/form-text-field"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

type Props<T extends FieldValues,> = {
  control: Control<T>
  name: FieldPath<T>
  labelKey?: string
}

export default function DirectoryEmailFormField<T extends FieldValues>({
  control,
  name,
  labelKey = "directory.email",
}: Props<T>) {
  const { t } = useTranslation()
  const field = (
    <FormTextField
      control={control}
      name={name}
      label={t(labelKey)}
      type="email"
      dir="ltr"
      disabled={!DIRECTORY_EMAIL_API_ENABLED}
    />
  )

  if (DIRECTORY_EMAIL_API_ENABLED) return field

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full">{field}</div>
      </TooltipTrigger>
      <TooltipContent>{t("directory.emailPendingBackend")}</TooltipContent>
    </Tooltip>
  )
}
