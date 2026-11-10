import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"
import { useTranslation } from "react-i18next"
import { cn } from "../lib/cn"
import Icon from "./Icon"
import { Input as UiInput } from "./input"
import { legacyNativeControlClassName } from "./field-styles"
import { Textarea as UiTextarea } from "./textarea"

export function FormField({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
  htmlFor?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {t(error)}
        </p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FormField label={label} error={error} htmlFor={fid}>
      <UiInput
        ref={ref}
        id={fid}
        aria-invalid={!!error}
        {...rest}
        className={cn("h-9", className)}
      />
    </FormField>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: {
    value: string
    label: string
  }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, error, options, placeholder, className, id, ...rest },
    ref,
  ) {
    const auto = useId()
    const fid = id ?? auto
    return (
      <FormField label={label} error={error} htmlFor={fid}>
        <select
          ref={ref}
          id={fid}
          aria-invalid={!!error}
          {...rest}
          className={cn(legacyNativeControlClassName, "h-9", className)}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>
    )
  },
)

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className, id, rows = 3, ...rest }, ref) {
    const auto = useId()
    const fid = id ?? auto
    return (
      <FormField label={label} error={error} htmlFor={fid}>
        <UiTextarea
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          rows={rows}
          {...rest}
          className={cn("min-h-0 rounded-lg py-2", className)}
        />
      </FormField>
    )
  },
)

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
  id?: string
}) {
  return (
    <div className={cn("relative min-w-0 w-full", className)}>
      <Icon
        name="search"
        size={16}
        className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <UiInput
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full bg-card ps-9"
      />
    </div>
  )
}

export { FilterSelect } from "./filter-select"

export const Switch = forwardRef<HTMLInputElement, {
  label: string
  hint?: string
} & InputHTMLAttributes<HTMLInputElement>>(function Switch(
  { label, hint, className, ...rest },
  ref,
) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 p-3",
        className,
      )}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        )}
      </span>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        {...rest}
        className="peer sr-only"
      />
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-border transition peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-ring after:absolute after:inset-s-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:start-4.5" />
    </label>
  )
})
