import * as React from "react"
import { useTranslation } from "react-i18next"
import { cn } from "../lib/cn"
import Icon from "./Icon"
import { Label } from "./label"
import { fieldControlClassName } from "./field-styles"

export type SearchOption = {
  value: string
  label: string
}

type SearchSelectProps = {
  value: string
  onChange: (value: string) => void
  options: SearchOption[]
  placeholder?: string
  /** Shows an × that clears the choice (onChange("")). */
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
} & Omit<React.ComponentProps<"input">, "value" | "onChange" | "disabled" | "className" | "placeholder">

/**
 * A text field that filters a list as you type: type part of a villa number or a name, then pick it with a click, or with
 * the arrow keys and Enter. When it is not being typed in, it shows the chosen option. Escape or leaving the field closes the
 * list and keeps the choice. Extra props (id, aria-*) go on the text field, so it works inside FormControl.
 */
export const SearchSelect =
  React.forwardRef<HTMLInputElement, SearchSelectProps>(function SearchSelect(
    {
      value,
      onChange,
      options,
      placeholder,
      clearable = false,
      disabled = false,
      loading = false,
      className,
      ...inputProps
    },
    ref,
  ) {
    const { t } = useTranslation()
    const listId = React.useId()
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [active, setActive] = React.useState(0)
    const listRef = React.useRef<HTMLUListElement>(null)

    const selected = options.find((o) => o.value === value)
    const matches = React.useMemo(() => {
      const q = query.trim().toLowerCase()
      return q
        ? options.filter((o) => o.label.toLowerCase().includes(q))
        : options
    }, [options, query])

    const close = () => {
      setOpen(false)
      setQuery("")
    }

    const choose = (option: SearchOption) => {
      onChange(option.value)
      close()
    }

    // Keeps the highlighted option in view while moving with the keys.
    React.useEffect(() => {
      if (!open) return
      const node = listRef.current?.children[active] as HTMLElement | undefined
      node?.scrollIntoView?.({ block: "nearest" })
    }, [active, open])

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setOpen(true)
        setActive((i) => Math.min(i + 1, Math.max(matches.length - 1, 0)))
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      } else if (event.key === "Enter" && open) {
        event.preventDefault()
        const option = matches[active]
        if (option) choose(option)
      } else if (event.key === "Escape" && open) {
        event.preventDefault()
        close()
      }
    }

    const shown = open ? query : (selected?.label ?? "")

    return (
      <div className={cn("relative min-w-0", className)}>
        <input
          ref={ref}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={shown}
          placeholder={
            loading
              ? t("common.loading")
              : open && selected
                ? selected.label
                : (placeholder ?? t("common.searchPick"))
          }
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={close}
          onKeyDown={onKeyDown}
          className={cn(
            fieldControlClassName,
            "flex h-9 w-full min-w-0 rounded-md py-1 ps-3 text-base md:text-sm",
            clearable && selected ? "pe-14" : "pe-8",
          )}
          {...inputProps}
        />
        <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center gap-1 text-muted-foreground">
          {clearable && selected && !disabled && (
            <button
              type="button"
              className="pointer-events-auto rounded p-0.5 hover:bg-muted hover:text-foreground"
              aria-label={t("common.clear")}
              // Before the field loses focus, so the click is not lost.
              onMouseDown={(e) => {
                e.preventDefault()
                onChange("")
                close()
              }}
            >
              <Icon name="x" size={14} />
            </button>
          )}
          <Icon name="search" size={14} />
        </span>
        {open && !disabled && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover p-1 text-sm shadow-lg"
          >
            {matches.length === 0 ? (
              <li className="px-2 py-1.5 text-muted-foreground">
                {t("common.noMatches")}
              </li>
            ) : (
              matches.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5",
                    index === active && "bg-muted",
                    option.value === value && "font-medium",
                  )}
                  dir="auto"
                  onMouseEnter={() => setActive(index)}
                  // mousedown, not click: it runs before the field's blur closes the list.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(option)
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <Icon
                      name="check"
                      size={14}
                      className="shrink-0 text-accent"
                    />
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    )
  })

/** A labelled SearchSelect for a list's filters: empty means every one ("All"). */
export function SearchFilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: SearchOption[]
  className?: string
}) {
  const { t } = useTranslation()
  const id = React.useId()
  return (
    <div className={cn("flex min-w-40 flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <SearchSelect
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={t("common.all")}
        clearable
        className="bg-card"
      />
    </div>
  )
}
