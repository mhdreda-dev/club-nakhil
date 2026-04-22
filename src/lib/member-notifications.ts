import { AccountStatus } from "@prisma/client";

type NotificationPayload = {
  event: string;
  recipients: string[];
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
};

async function sendNotification(payload: NotificationPayload) {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Notification dispatch warning:", error);
  }
}

function getAdminRecipients() {
  const rawRecipients = process.env.ADMIN_NOTIFICATION_EMAILS ?? "";

  return rawRecipients
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function notifyAdminsOfPendingMember(input: {
  memberId: string;
  fullName: string;
  email: string;
}) {
  const recipients = getAdminRecipients();

  if (!recipients.length) {
    return;
  }

  await sendNotification({
    event: "member_registration_pending",
    recipients,
    subject: "New member registration pending approval",
    message: `${input.fullName} (${input.email}) just registered and is waiting for approval.`,
    metadata: {
      memberId: input.memberId,
      fullName: input.fullName,
      email: input.email,
    },
  });
}

export async function notifyMemberStatusChanged(input: {
  fullName: string;
  email: string;
  status: AccountStatus;
}) {
  if (input.status === AccountStatus.PENDING) {
    return;
  }

  const subject =
    input.status === AccountStatus.ACTIVE
      ? "Your Club Nakhil account is now active"
      : "Your Club Nakhil account status was updated";

  const message =
    input.status === AccountStatus.ACTIVE
      ? `Hi ${input.fullName}, your account has been approved. You can now log in.`
      : `Hi ${input.fullName}, your account is currently blocked. Contact support for details.`;

  await sendNotification({
    event: "member_status_changed",
    recipients: [input.email],
    subject,
    message,
    metadata: {
      email: input.email,
      status: input.status,
    },
  });
}
