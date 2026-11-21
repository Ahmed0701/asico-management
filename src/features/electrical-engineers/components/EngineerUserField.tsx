import { useTranslation } from "react-i18next"
import type { Control } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { SearchSelect } from "@/shared/ui/search-select"
import { useElectricalEngineerUserOptions } from "../api"
import type { ElectricalEngineerFormValues } from "../schema"

type Props = {
  control: Control<ElectricalEngineerFormValues>
  /** The engineer being changed; none when adding one. */
  engineerId?: string
}

/**
 * The user account of the engineer: signed in with it, the user sees only this engineer's villas. A user already linked
 * to another engineer is shown with that engineer's name (picking it is refused by the server); ADMINs are not offered.
 */
export default function EngineerUserField({ control, engineerId }: Props) {
  const { t } = useTranslation()
  const users = useElectricalEngineerUserOptions()

  const options = (users.data ?? []).map((user) => {
    const taken = user.engineer && user.engineer.id !== engineerId
    const notes = [
      user.email,
      taken
        ? t("electricalEngineers.userLinkedTo", { name: user.engineer!.name })
        : null,
      user.isActive ? null : t("electricalEngineers.userInactive"),
    ].filter(Boolean)
    return { value: user.id, label: `${user.name} (${notes.join(", ")})` }
  })

  return (
    <FormField
      control={control}
      name="userId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("electricalEngineers.userAccount")}</FormLabel>
          <FormControl>
            <SearchSelect
              value={field.value}
              onChange={field.onChange}
              options={options}
              loading={users.isLoading}
              clearable
              placeholder={t("electricalEngineers.userAccountPlaceholder")}
              aria-label={t("electricalEngineers.userAccount")}
            />
          </FormControl>
          <FormDescription>
            {users.isError
              ? t("electricalEngineers.userOptionsFailed")
              : t("electricalEngineers.userAccountHint")}
          </FormDescription>
          <FormMessage className="text-red-500 text-[10px]" />
        </FormItem>
      )}
    />
  )
}
