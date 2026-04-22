export const AUTH_ERROR_CODES = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACCOUNT_BLOCKED: "ACCOUNT_BLOCKED",
} as const;

export function getLoginErrorMessage(code: string | null | undefined) {
  if (code === AUTH_ERROR_CODES.PENDING_APPROVAL) {
    return "Your account is waiting for admin approval.";
  }

  if (code === AUTH_ERROR_CODES.ACCOUNT_BLOCKED || code === "blocked") {
    return "Your account is blocked. Please contact an administrator.";
  }

  return "Invalid credentials. Check your email and password.";
}
