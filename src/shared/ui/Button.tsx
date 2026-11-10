import type { ButtonHTMLAttributes } from "react"
import { cn } from "../lib/cn"
import Icon, { type IconName } from "./Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: "sm" | "md"
  icon?: IconName
}

const motionSafe =
  "motion-reduce:transition-none transition-all duration-300 ease-in-out"

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  success: `bg-success text-success-foreground hover:opacity-90 ${motionSafe}`,
  danger: cn(
    "border border-danger/35 bg-danger-soft text-danger",
    "hover:bg-danger hover:text-white hover:border-danger",
    "focus-visible:bg-danger focus-visible:text-white focus-visible:border-danger",
    motionSafe,
  ),
}

export default function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
        variants[variant],
        className,
      )}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  )
}

const iconButtonBase =
  "inline-flex size-8 items-center justify-center rounded-lg disabled:pointer-events-none"

const iconButtonVariants = {
  default: cn(
    "text-muted-foreground hover:bg-muted hover:text-foreground",
    motionSafe,
  ),
  danger: cn(
    "border border-danger/35 bg-danger-soft text-danger",
    "hover:bg-danger hover:text-white hover:border-danger",
    "focus-visible:bg-danger focus-visible:text-white focus-visible:border-danger",
    motionSafe,
  ),
  success: cn(
    "border border-success/35 bg-success-soft text-success",
    "hover:bg-success hover:text-success-foreground hover:border-success",
    "focus-visible:bg-success focus-visible:text-success-foreground focus-visible:border-success",
    motionSafe,
  ),
} as const

export function IconButton({
  icon,
  label,
  variant = "default",
  className,
  disabled,
  title,
  ...rest
}: {
  icon: IconName
  label: string
  variant?: keyof typeof iconButtonVariants
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const tooltipText = title ?? label

  const button = (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      {...rest}
      className={cn(iconButtonBase, iconButtonVariants[variant], className)}
    >
      <Icon name={icon} size={16} />
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? (
          <span className="inline-flex cursor-not-allowed">{button}</span>
        ) : (
          button
        )}
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipText}</TooltipContent>
    </Tooltip>
  )
}
