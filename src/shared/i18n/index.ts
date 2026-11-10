import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./en.json"
import ar from "./ar.json"

export type Lang = "en" | "ar"

const stored = (typeof localStorage !== "undefined" &&
  localStorage.getItem("asico-lang")) as Lang | null

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: stored === "ar" ? "ar" : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
