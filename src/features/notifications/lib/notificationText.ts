import type { LocalizedText } from "../api/notifications.types"

export function pickLocalizedText(
  text: LocalizedText,
  language: string,
): string {
  return language === "ar" ? text.ar : text.en
}
