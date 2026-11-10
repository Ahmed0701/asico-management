/** Label from GET /audit-logs/filters actionLabels, or the action code when missing. */
export function resolveAuditActionLabel(
  action: string,
  actionLabels?: Record<string, string>,
): string {
  const fromApi = actionLabels?.[action]?.trim()
  if (fromApi) return fromApi
  return action
}
