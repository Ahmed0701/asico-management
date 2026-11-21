import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff } from "lucide-react"
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
  // A password field has an eye button that shows what was typed, and hides it again.
  const isPassword = type === "password"
  const [visible, setVisible] = useState(false)
  const inputType = isPassword && visible ? "text" : type

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-xs font-normal text-muted-foreground">
            {label}
          </FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                type={inputType}
                autoComplete={autoComplete}
                disabled={disabled}
                readOnly={readOnly}
                dir={dir}
                inputMode={inputMode}
                maxLength={maxLength}
                placeholder={placeholder}
                className={
                  isPassword
                    ? [className, "pe-10"].filter(Boolean).join(" ")
                    : className
                }
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
            {isPassword && (
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={
                  visible ? t("common.hidePassword") : t("common.showPassword")
                }
                aria-pressed={visible}
                title={
                  visible ? t("common.hidePassword") : t("common.showPassword")
                }
                disabled={disabled}
                className="absolute inset-y-0 end-0 grid w-10 place-items-center rounded-e-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {visible ? (
                  <EyeOff size={16} aria-hidden />
                ) : (
                  <Eye size={16} aria-hidden />
                )}
              </button>
            )}
          </div>
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
