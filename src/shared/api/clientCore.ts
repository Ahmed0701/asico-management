import axios from "axios"
import i18n from "@/shared/i18n"
import { getAccessToken } from "@/shared/auth/accessToken"
import { API_BASE_URL } from "@/shared/config/apiBase"

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const lang = i18n.language === "ar" ? "ar" : "en"
  config.headers["Accept-Language"] = lang
  return config
})
