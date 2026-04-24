import { Role } from "@prisma/client";

export function getDashboardPathByRole(role: Role) {
  if (role === Role.ADMIN) {
    return "/admin/dashboard";
  }

  if (role === Role.COACH) {
    return "/coach/dashboard";
  }

  return "/member/dashboard";
}
