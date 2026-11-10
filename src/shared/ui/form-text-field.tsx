import { useTranslation } from "react-i18next"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Input } from "./input"
import { FormControl, FormField, FormItem, FormLabel } from "./form"

type FormTextFieldProps<T extends FieldValues,> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  type?: React.ComponentProps<"input">["type"]
  autoComplete?: string
  disabled?: boolean
  dir?: "ltr" | "rtl" | "auto"
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onValueChange?: () => void
  className?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  maxLength?: number
  placeholder?: string
  readOnly?: boolean
} & Pick<React.ComponentProps<"input">, "aria-label" | "aria-describedby" | "aria-invalid" | "aria-required" | "autoFocus" | "id">

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  autoComplete,
  disabled,
  dir,
  onBlur,
  onValueChange,
  className,
  inputMode,
  maxLength,
  placeholder,
  readOnly,
  ...ariaAndId
}: FormTextFieldProps<T>) {
  const { t } = useTranslation()

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
            <Input
              type={type}
              autoComplete={autoComplete}
              disabled={disabled}
              readOnly={readOnly}
              dir={dir}
              inputMode={inputMode}
              maxLength={maxLength}
              placeholder={placeholder}
              className={className}
              {...ariaAndId}
              {...field}
              aria-invalid={fieldState.invalid ? true : undefined}
              onBlur={(e) => {
                field.onBlur()
                onBlur?.(e)
              }}
              onChange={(e) => {
                field.onChange(e)
                onValueChange?.()
              }}
            />
          </FormControl>
          {fieldState.error?.message ? (
            <p role="alert" className="text-[10px] text-danger">
              {t(String(fieldState.error.message))}
            </p>
          ) : null}
        </FormItem>
      )}
    />
  )
}
