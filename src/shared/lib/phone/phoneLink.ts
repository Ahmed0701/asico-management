const TEL_SAFE = /^\+?[0-9]+$/

export function safeTelHref(phone: string): string | undefined {
  const stripped = phone.replace(/[\s-]/g, "")
  if (!TEL_SAFE.test(stripped)) return undefined
  return `tel:${stripped}`
}
