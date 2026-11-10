export function parseDownloadFilename(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback
  const star = /filename\*=UTF-8''([^;\n]+)/i.exec(contentDisposition)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim())
    } catch {
      /* use fallback below */
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(contentDisposition)
  if (quoted?.[1]) return quoted[1]
  const unquoted = /filename=([^;\n]+)/i.exec(contentDisposition)
  if (unquoted?.[1]) return unquoted[1].trim()
  return fallback
}
