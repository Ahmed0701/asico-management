import {
  api,
  refreshAccessToken,
  toApiError,
  unwrap,
} from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import { applyAccessToken } from "@/shared/auth/accessToken"
import type {
  AccessTokenDto,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginDto,
  LoginInput,
  MeDto,
  ResetPasswordInput,
  SignupInput,
  UpdateMeInput,
  UserDto,
} from "./auth.types"

async function afterAccessTokenIssued(): Promise<void> {
  const {
    scheduleProactiveAccessRefresh,
    ensureProactiveAccessRefreshListeners,
  } = await import("@/shared/auth/proactiveAccessRefresh")
  ensureProactiveAccessRefreshListeners()
  scheduleProactiveAccessRefresh()
}

export async function login(input: LoginInput): Promise<LoginDto> {
  try {
    const body = await unwrap(
      api.post<ApiSuccess<LoginDto>>("/auth/login", input),
    )
    applyAccessToken(body.accessToken, body.expiresIn)
    await afterAccessTokenIssued()
    return body
  } catch (error) {
    throw toApiError(error)
  }
}

export async function signup(input: SignupInput): Promise<void> {
  await unwrap(
    api.post<ApiSuccess<{
      user: UserDto
      message: string
    }>>("/auth/signup", input),
  )
}

export async function refreshSession(): Promise<AccessTokenDto> {
  const body = await refreshAccessToken({ notifyExpiry: false })
  if (!body) {
    throw new Error("SESSION_REFRESH_FAILED")
  }
  return body
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}

export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<void> {
  await unwrap(
    api.post<ApiSuccess<{ ok: true }>>("/auth/forgot-password", input),
  )
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await unwrap(
    api.post<ApiSuccess<{ ok: true }>>("/auth/reset-password", input),
  )
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  await unwrap(
    api.post<ApiSuccess<{ ok: true }>>("/auth/change-password", input),
  )
}

export async function getMe(): Promise<MeDto> {
  return unwrap(api.get<ApiSuccess<MeDto>>("/me"))
}

export async function updateMe(input: UpdateMeInput): Promise<MeDto> {
  return unwrap(api.patch<ApiSuccess<MeDto>>("/me", input))
}
