import type { Translate } from "@/lib/i18n";

export const AUTH_ERROR_CODES = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACCOUNT_BLOCKED: "ACCOUNT_BLOCKED",
} as const;

export function getLoginErrorMessage(code: string | null | undefined, t?: Translate) {
  if (code === AUTH_ERROR_CODES.PENDING_APPROVAL) {
    return t ? t("auth.errors.pendingApproval") : "Your account is waiting for admin approval.";
  }

  if (code === AUTH_ERROR_CODES.ACCOUNT_BLOCKED || code === "blocked") {
    return t ? t("auth.errors.accountBlocked") : "Your account is blocked. Please contact an administrator.";
  }

  return t ? t("auth.errors.invalidCredentials") : "Invalid credentials. Check your email and password.";
}
