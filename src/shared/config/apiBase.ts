/** Same-origin API prefix; override with VITE_API_BASE_URL (see .env.example, .env.demo). */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api/v1"
