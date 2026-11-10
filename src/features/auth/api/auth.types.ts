export type Role = "ADMIN" | "EMPLOYEE"

export type UserDto = {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
}

export type MeDto = UserDto & { permissions: string[] }

export type LoginDto = {
  accessToken: string
  expiresIn: number
  user: UserDto
}

export type AccessTokenDto = {
  accessToken: string
  expiresIn: number
}

export type LoginInput = {
  email: string
  password: string
}
export type SignupInput = {
  name: string
  email: string
  password: string
}
export type ForgotPasswordInput = { email: string }
export type ResetPasswordInput = {
  token: string
  password: string
}
export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}
export type UpdateMeInput = { name: string }
