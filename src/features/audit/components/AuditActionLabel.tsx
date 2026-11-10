export default function AuditActionLabel({
  action,
  actionLabel,
}: {
  action: string
  actionLabel: string
}) {
  const showTooltip = actionLabel !== action
  return (
    <span title={showTooltip ? action : undefined} className="cursor-default">
      {actionLabel}
    </span>
  )
}
