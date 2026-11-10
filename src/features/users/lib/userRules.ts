import type { MeDto } from "@/features/auth/api/auth.types"
import type { UserListItem } from "../api/users.types"

export function userActionRules(
  target: Pick<UserListItem, "id" | "role">,
  me: MeDto | undefined,
) {
  const isSelf = me?.id === target.id
  const isTargetAdmin = target.role === "ADMIN"
  const isSignedInAdmin = me?.role === "ADMIN"
  return {
    isSelf,
    isTargetAdmin,
    isSignedInAdmin,
    canEditProfile: !isTargetAdmin || isSignedInAdmin,
    canEditPermissions: !isTargetAdmin && !isSelf,
    canDeactivate: !isTargetAdmin && !isSelf,
    canDelete: !isTargetAdmin && !isSelf,
    canResetPassword: !isTargetAdmin || isSignedInAdmin,
  }
}
