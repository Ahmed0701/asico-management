import type { CSSProperties, ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel } from "@/shared/ui/form"
import { SearchSelect } from "@/shared/ui/search-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"

type Option = {
  value: string
  label: string
}

type SelectFieldProps = {
  options: Option[]
  placeholder?: string
}

type FieldProps<T extends FieldValues,> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
}

function FieldError({ message }: { message?: string }) {
  const { t } = useTranslation()
  if (!message) return null
  return (
    <p role="alert" className="text-[10px] text-danger">
      {t(message)}
    </p>
  )
}

/** A pick from a short fixed list, as a form field. */
export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
}: FieldProps<T> & SelectFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-xs font-normal text-muted-foreground">
            {label}
          </FormLabel>
          <Select value={field.value as string} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger
                className="h-9 w-full"
                aria-invalid={fieldState.invalid || undefined}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldState.error?.message} />
        </FormItem>
      )}
    />
  )
}

/** A pick from a long list you can type to filter (an item, a villa), as a form field. */
export function FormSearchSelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  loading,
  placeholder,
  clearable,
  renderOption,
  selectedStyle,
}: FieldProps<T> & {
  renderOption?: (option: Option) => ReactNode
  selectedStyle?: CSSProperties
  options: Option[]
  loading?: boolean
  placeholder?: string
  clearable?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-xs font-normal text-muted-foreground">
            {label}
          </FormLabel>
          <FormControl>
            <SearchSelect
              value={field.value as string}
              onChange={field.onChange}
              options={options}
              loading={loading}
              placeholder={placeholder}
              clearable={clearable}
              renderOption={renderOption}
              selectedStyle={selectedStyle}
              aria-invalid={fieldState.invalid || undefined}
            />
          </FormControl>
          <FieldError message={fieldState.error?.message} />
        </FormItem>
      )}
    />
  )
}

/** Free text over several lines, as a form field. */
export function FormTextareaField<T extends FieldValues>({
  control,
  name,
  label,
  maxLength,
}: FieldProps<T> & { maxLength?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-xs font-normal text-muted-foreground">
            {label}
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={field.value as string}
              rows={3}
              maxLength={maxLength}
              dir="auto"
              aria-invalid={fieldState.invalid || undefined}
            />
          </FormControl>
          <FieldError message={fieldState.error?.message} />
        </FormItem>
      )}
    />
  )
}
