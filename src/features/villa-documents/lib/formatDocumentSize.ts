export function formatDocumentSizeBytes(bytes: number, locale: string): string {
  const loc = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US"
  if (bytes < 1024) {
    return new Intl.NumberFormat(loc).format(bytes) + " B"
  }
  if (bytes < 1024 * 1024) {
    return (
      new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(
        bytes / 1024,
      ) + " KB"
    )
  }
  return (
    new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(
      bytes / (1024 * 1024),
    ) + " MB"
  )
}
