import { http, HttpResponse } from "msw"
import {
  listMockNotifications,
  markAllMockNotificationsRead,
  markMockNotificationRead,
  mockSmallWorks,
} from "./fixtures/smallWorksNotifications"
import { mockOpenWorks } from "./fixtures/openWorks"
import { mockDailyReports } from "./fixtures/dailyReports"

const base = "/api/v1"

export const PERMISSIONS_EMPLOYEE = [
  "villas:read",
  "villas:detail",
  "villas:create",
  "villas:update",
  "villas:delete",
  "villas:export",
  "contractors:read",
]

export const handlers = [
  http.post(`*${base}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string
      password: string
    }
    if (body.email === "inactive@asico.example") {
      return HttpResponse.json(
        { error: { code: "ACCOUNT_INACTIVE", message: "Account inactive" } },
        { status: 403 },
      )
    }
    if (body.password !== "valid-password") {
      return HttpResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        },
        { status: 401 },
      )
    }
    return HttpResponse.json({
      data: {
        accessToken: "login-access-token",
        expiresIn: 900,
        user: {
          id: "u1",
          name: "Test User",
          email: body.email,
          role: "EMPLOYEE",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      },
    })
  }),

  http.post(`*${base}/auth/refresh`, () => {
    return HttpResponse.json({
      data: { accessToken: "refreshed-access-token", expiresIn: 900 },
    })
  }),

  http.post(
    `*${base}/auth/logout`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.get(`*${base}/me`, ({ request }) => {
    const auth = request.headers.get("Authorization")
    if (!auth?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      )
    }
    const token = auth.slice("Bearer ".length)
    if (
      token === "refreshed-access-token" ||
      token === "login-access-token" ||
      token === "seed-token" ||
      token === "admin-token"
    ) {
      const isAdmin = token === "admin-token"
      return HttpResponse.json({
        data: {
          id: "u1",
          name: isAdmin ? "Admin User" : "Test User",
          email: "test@asico.example",
          role: isAdmin ? "ADMIN" : "EMPLOYEE",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          permissions: isAdmin ? [] : PERMISSIONS_EMPLOYEE,
        },
      })
    }
    return HttpResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    )
  }),

  http.get(`*${base}/open-works`, () =>
    HttpResponse.json({
      data: mockOpenWorks,
      meta: { page: 1, limit: 20, total: mockOpenWorks.length, totalPages: 1 },
    }),
  ),

  http.get(`*${base}/daily-reports`, ({ request }) => {
    const contractorId = new URL(request.url).searchParams.get("contractorId")
    let rows = [...mockDailyReports]
    if (contractorId) {
      rows = rows.filter((r) => r.contractor.id === contractorId)
    }
    return HttpResponse.json({
      data: rows,
      meta: { page: 1, limit: 20, total: rows.length, totalPages: 1 },
    })
  }),

  http.get(`*${base}/small-works`, ({ request }) => {
    const url = new URL(request.url)
    const overdue = url.searchParams.get("overdue") === "true"
    const dueSoon = url.searchParams.get("dueSoon") === "true"
    let rows = [...mockSmallWorks]
    if (overdue) rows = rows.filter((r) => r.overdue)
    if (dueSoon) rows = rows.filter((r) => r.dueSoon)
    return HttpResponse.json({
      data: rows,
      meta: {
        page: 1,
        limit: 20,
        total: rows.length,
        totalPages: 1,
      },
    })
  }),

  http.get(`*${base}/notifications`, ({ request }) => {
    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get("unread") === "true"
    const { data, unreadCount } = listMockNotifications(unreadOnly)
    return HttpResponse.json({
      data,
      meta: {
        page: 1,
        limit: Number(url.searchParams.get("limit") ?? 20),
        total: data.length,
        totalPages: 1,
        unreadCount,
      },
    })
  }),

  http.post(`*${base}/notifications/read-all`, () =>
    HttpResponse.json({ data: { updated: markAllMockNotificationsRead() } }),
  ),

  http.post(`*${base}/notifications/:id/read`, ({ params }) => {
    const updated = markMockNotificationRead(String(params.id))
    if (!updated) {
      return HttpResponse.json(
        { error: { code: "NOTIFICATION_NOT_FOUND", message: "Not found" } },
        { status: 404 },
      )
    }
    return HttpResponse.json({ data: updated })
  }),

  http.get(`*${base}/protected-resource`, ({ request }) => {
    const auth = request.headers.get("Authorization")
    if (auth === "Bearer expired-token") {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      )
    }
    if (auth === "Bearer refreshed-access-token") {
      return HttpResponse.json({ data: { ok: true } })
    }
    return HttpResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    )
  }),
]

export const adminMeHandler = http.get(`${base}/me`, () =>
  HttpResponse.json({
    data: {
      id: "admin",
      name: "Admin",
      email: "admin@asico.example",
      role: "ADMIN",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      permissions: [],
    },
  }),
)
