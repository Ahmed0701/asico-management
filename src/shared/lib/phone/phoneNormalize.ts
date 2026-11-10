const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩"
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹"

export function normalizeAsciiDigits(input: string): string {
  let out = ""
  for (const ch of input) {
    const ar = ARABIC_INDIC.indexOf(ch)
    if (ar >= 0) {
      out += String(ar)
      continue
    }
    const fa = PERSIAN.indexOf(ch)
    if (fa >= 0) {
      out += String(fa)
      continue
    }
    out += ch
  }
  return out
}

export function normalizePhoneInput(value: string): string {
  return normalizeAsciiDigits(value).trim()
}

export function normalizeSearchInput(value: string): string {
  return normalizeAsciiDigits(value).trim()
}
