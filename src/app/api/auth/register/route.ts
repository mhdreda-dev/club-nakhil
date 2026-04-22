import { AccountStatus, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { uploadAvatarObject } from "@/features/profiles/avatar.repository";
import { buildAvatarStoragePath, validateAvatarFile } from "@/features/profiles/avatar.schemas";
import { notifyAdminsOfPendingMember } from "@/lib/member-notifications";
import { prisma } from "@/lib/prisma";
import { memberRegistrationSchema } from "@/lib/validation";

export const runtime = "nodejs";

type FieldErrors = Record<string, string>;
type RegisterErrorResponse = {
  ok: false;
  message: string;
  fieldErrors?: FieldErrors;
};

type RegisterSuccessResponse = {
  ok: true;
  message: string;
  pending: true;
  email: string;
  warning: string | null;
  warningCode: "avatar-upload-failed" | null;
};

function logRegisterStep(requestId: string, step: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[register:${requestId}] ${step}`, details);
    return;
  }

  console.info(`[register:${requestId}] ${step}`);
}

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function mapIssuesToFieldErrors(
  issues: Array<{
    path: PropertyKey[];
    message: string;
  }>,
) {
  const fieldErrors: FieldErrors = {};

  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");

    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

function getRegisterValidationSummary(fieldErrors: FieldErrors) {
  if (fieldErrors.profileImage) {
    return "Please upload a valid image under 3 MB.";
  }

  if (fieldErrors.confirmPassword?.toLowerCase().includes("match")) {
    return "Passwords do not match.";
  }

  const hasFormatIssue = Object.values(fieldErrors).some((message) => {
    const lowerMessage = message.toLowerCase();

    return (
      lowerMessage.includes("valid") ||
      lowerMessage.includes("at least") ||
      lowerMessage.includes("already exists") ||
      lowerMessage.includes("invalid") ||
      lowerMessage.includes("too long") ||
      lowerMessage.includes("under 3 mb")
    );
  });

  return hasFormatIssue
    ? "Some information is missing or invalid."
    : "Please review the required fields.";
}

function errorResponse(message: string, status: number, fieldErrors?: FieldErrors) {
  const body: RegisterErrorResponse = {
    ok: false,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };

  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();

  try {
    logRegisterStep(requestId, "route entered", {
      method: request.method,
      contentType: request.headers.get("content-type"),
    });

    logRegisterStep(requestId, "before request.formData()");
    const formData = await request.formData();
    logRegisterStep(requestId, "after request.formData()", {
      durationMs: Date.now() - startedAt,
    });

    const avatarField = formData.get("profileImage");
    const avatarFile =
      avatarField instanceof File && avatarField.size > 0 ? avatarField : null;
    const fullName = getStringField(formData, "fullName");
    const email = getStringField(formData, "email");
    const phone = getStringField(formData, "phone");
    const password = getStringField(formData, "password");
    const confirmPassword = getStringField(formData, "confirmPassword");
    const dateOfBirth = getStringField(formData, "dateOfBirth");
    const gender = getStringField(formData, "gender");
    const address = getStringField(formData, "address");
    const emergencyContact = getStringField(formData, "emergencyContact");
    const sportLevel = getStringField(formData, "sportLevel");
    const membershipType = getStringField(formData, "membershipType");

    logRegisterStep(requestId, "after extracting fields", {
      email,
      hasAvatar: Boolean(avatarFile),
      avatarName: avatarFile?.name ?? null,
      avatarSize: avatarFile?.size ?? null,
      avatarType: avatarFile?.type ?? null,
      fullNameLength: fullName.length,
      phoneLength: phone.length,
      dateOfBirth,
      gender,
      addressLength: address.length,
      emergencyContactLength: emergencyContact.length,
      sportLevel,
      membershipType,
    });

    if (avatarFile) {
      const parsedAvatar = validateAvatarFile(avatarFile);

      if (!parsedAvatar.success) {
        const fieldErrors = {
          profileImage: parsedAvatar.error.issues[0]?.message ?? "Invalid image file.",
        };

        return errorResponse(
          getRegisterValidationSummary(fieldErrors),
          400,
          fieldErrors,
        );
      }
    }

    logRegisterStep(requestId, "before validation");
    const parsed = memberRegistrationSchema.safeParse({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      sportLevel,
      membershipType,
    });
    logRegisterStep(requestId, "after validation", {
      success: parsed.success,
    });

    if (!parsed.success) {
      const fieldErrors = mapIssuesToFieldErrors(parsed.error.issues);

      return errorResponse(
        getRegisterValidationSummary(fieldErrors),
        400,
        fieldErrors,
      );
    }

    logRegisterStep(requestId, "before existing user lookup");
    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      select: {
        id: true,
      },
    });
    logRegisterStep(requestId, "after existing user lookup", {
      exists: Boolean(existingUser),
      durationMs: Date.now() - startedAt,
    });

    if (existingUser) {
      return errorResponse(
        "This email is already registered.",
        409,
        {
          email: "An account with this email already exists.",
        },
      );
    }

    logRegisterStep(requestId, "before password hash");
    const passwordHash = await hash(parsed.data.password, 12);
    logRegisterStep(requestId, "after password hash", {
      durationMs: Date.now() - startedAt,
    });

    const normalizedDateOfBirth = new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`);
    const normalizedAddress = parsed.data.address.length ? parsed.data.address : null;

    logRegisterStep(requestId, "before user create");
    const user = await prisma.user.create({
      data: {
        name: parsed.data.fullName,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        passwordHash,
        role: Role.MEMBER,
        status: AccountStatus.PENDING,
        phone: parsed.data.phone,
        dateOfBirth: normalizedDateOfBirth,
        gender: parsed.data.gender,
        address: normalizedAddress,
        emergencyContact: parsed.data.emergencyContact,
        sportLevel: parsed.data.sportLevel,
        membershipType: parsed.data.membershipType,
        profile: {
          create: {
            fullName: parsed.data.fullName,
            displayName: parsed.data.fullName,
            phone: parsed.data.phone,
            dateOfBirth: normalizedDateOfBirth,
            gender: parsed.data.gender,
            address: normalizedAddress,
            emergencyContact: parsed.data.emergencyContact,
            memberProfile: {
              create: {
                trainingLevel: parsed.data.sportLevel,
              },
            },
          },
        },
      },
    });
    logRegisterStep(requestId, "after user create", {
      userId: user.id,
      durationMs: Date.now() - startedAt,
    });

    let avatarWarning: string | null = null;
    let avatarWarningCode: RegisterSuccessResponse["warningCode"] = null;

    logRegisterStep(requestId, "before avatar logic", {
      hasAvatar: Boolean(avatarFile),
    });
    if (avatarFile) {
      try {
        const avatarPath = buildAvatarStoragePath(user.id, avatarFile.type);
        const avatarUrl = await uploadAvatarObject({
          path: avatarPath,
          data: await avatarFile.arrayBuffer(),
          contentType: avatarFile.type,
        });

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            profileImage: avatarUrl,
            profile: {
              update: {
                avatarUrl,
                avatarPath,
              },
            },
          },
        });
      } catch (error) {
        console.error("Avatar upload warning during registration:", {
          userId: user.id,
          email: user.email,
          fileName: avatarFile.name,
          fileSize: avatarFile.size,
          fileType: avatarFile.type,
          error,
        });
        avatarWarning = "Your account was created, but the profile image could not be uploaded.";
        avatarWarningCode = "avatar-upload-failed";
      }
    }

    notifyAdminsOfPendingMember({
      memberId: user.id,
      fullName: parsed.data.fullName,
      email: user.email,
    }).catch((notificationError) => {
      console.error("Admin notification warning after registration:", notificationError);
    });

    const body: RegisterSuccessResponse = {
      ok: true,
      message: "Registration submitted. Your account is waiting for admin approval.",
      pending: true,
      email: user.email,
      warning: avatarWarning,
      warningCode: avatarWarningCode,
    };

    logRegisterStep(requestId, "before final return", {
      durationMs: Date.now() - startedAt,
      warningCode: avatarWarningCode,
    });

    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    console.error(`[register:${requestId}] catch`, {
      durationMs: Date.now() - startedAt,
      error,
    });

    return errorResponse("Unable to complete sign up right now.", 500);
  }
}
