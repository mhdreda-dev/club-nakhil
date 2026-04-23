import { AccountStatus, Prisma, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { uploadAvatarObject } from "@/features/profiles/avatar.repository";
import { createMemberProfileCreateData } from "@/features/profiles/member-profile";
import { buildAvatarStoragePath, validateAvatarFile } from "@/features/profiles/avatar.schemas";
import { notifyAdminsOfPendingMember } from "@/lib/member-notifications";
import { prisma } from "@/lib/prisma";
import { memberRegistrationSchema } from "@/lib/validation";

export const runtime = "nodejs";

type FieldErrors = Record<string, string>;
type RegisterDebugResponse = {
  step: string;
  errorName: string;
  message?: string;
  code?: string;
  clientVersion?: string | null;
  meta?: Record<string, unknown> | null;
};

type RegisterErrorResponse = {
  ok: false;
  message: string;
  fieldErrors?: FieldErrors;
  debug?: RegisterDebugResponse;
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

function jsonResponse(
  requestId: string,
  body: RegisterErrorResponse | RegisterSuccessResponse,
  status: number,
) {
  console.info(`[register:${requestId}] returning response`, {
    status,
    body,
  });

  return NextResponse.json(body, { status });
}

function errorResponse(
  requestId: string,
  message: string,
  status: number,
  fieldErrors?: FieldErrors,
  debug?: RegisterDebugResponse,
) {
  const body: RegisterErrorResponse = {
    ok: false,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(debug ? { debug } : {}),
  };

  return jsonResponse(requestId, body, status);
}

function serializeRegisterError(step: string, error: unknown): RegisterDebugResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      step,
      errorName: error.name,
      message: error.message,
      code: error.code,
      clientVersion: error.clientVersion,
      meta: (error.meta as Record<string, unknown> | undefined) ?? null,
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      step,
      errorName: error.name,
      message: error.message,
      clientVersion: error.clientVersion,
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      step,
      errorName: error.name,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      step,
      errorName: error.name,
      message: error.message,
    };
  }

  return {
    step,
    errorName: "UnknownError",
    message: typeof error === "string" ? error : "Unknown error",
  };
}

function getRegisterErrorResponse(
  requestId: string,
  step: string,
  error: unknown,
) {
  const debug = serializeRegisterError(step, error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return errorResponse(
        requestId,
        "This email is already registered.",
        409,
        {
          email: "An account with this email already exists.",
        },
        debug,
      );
    }

    if (error.code === "P2021" || error.code === "P2022") {
      return errorResponse(
        requestId,
        'Registration is blocked because the production database schema is out of date. Run "npm run prisma:deploy" against the production database, then redeploy.',
        500,
        undefined,
        debug,
      );
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return errorResponse(
      requestId,
      "Registration could not reach the database. Check DATABASE_URL/DIRECT_URL and database availability.",
      500,
      undefined,
      debug,
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return errorResponse(
      requestId,
      "Registration failed because the Prisma client and database schema are out of sync.",
      500,
      undefined,
      debug,
    );
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return errorResponse(
      requestId,
      `Registration failed during ${step}: ${error.message.trim()}`,
      500,
      undefined,
      debug,
    );
  }

  return errorResponse(
    requestId,
    "Unable to complete sign up right now.",
    500,
    undefined,
    debug,
  );
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();
  let currentStep = "route entered";

  try {
    logRegisterStep(requestId, "route entered", {
      method: request.method,
      contentType: request.headers.get("content-type"),
    });

    currentStep = "request.formData";
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
      parsedFields: {
        fullName,
        email,
        phone,
        dateOfBirth,
        gender,
        address,
        emergencyContact,
        sportLevel,
        membershipType,
        passwordLength: password.length,
        confirmPasswordLength: confirmPassword.length,
      },
      hasAvatar: Boolean(avatarFile),
      avatarName: avatarFile?.name ?? null,
      avatarSize: avatarFile?.size ?? null,
      avatarType: avatarFile?.type ?? null,
    });

    if (avatarFile) {
      currentStep = "avatar validation";
      const parsedAvatar = validateAvatarFile(avatarFile);

      if (!parsedAvatar.success) {
        const fieldErrors = {
          profileImage: parsedAvatar.error.issues[0]?.message ?? "Invalid image file.",
        };

        return errorResponse(
          requestId,
          getRegisterValidationSummary(fieldErrors),
          400,
          fieldErrors,
        );
      }
    }

    currentStep = "schema validation";
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
      issues: parsed.success ? [] : parsed.error.issues,
    });

    if (!parsed.success) {
      const fieldErrors = mapIssuesToFieldErrors(parsed.error.issues);

      return errorResponse(
        requestId,
        getRegisterValidationSummary(fieldErrors),
        400,
        fieldErrors,
      );
    }

    currentStep = "existing user lookup";
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
        requestId,
        "This email is already registered.",
        409,
        {
          email: "An account with this email already exists.",
        },
      );
    }

    currentStep = "password hash";
    logRegisterStep(requestId, "before password hash");
    const passwordHash = await hash(parsed.data.password, 12);
    logRegisterStep(requestId, "after password hash", {
      durationMs: Date.now() - startedAt,
    });

    const normalizedDateOfBirth = new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`);
    const normalizedAddress = parsed.data.address.length ? parsed.data.address : null;

    currentStep = "user create";
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
                ...createMemberProfileCreateData(parsed.data.sportLevel),
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
        currentStep = "avatar upload";
        const avatarPath = buildAvatarStoragePath(user.id, avatarFile.type);
        const avatarUrl = await uploadAvatarObject({
          path: avatarPath,
          data: await avatarFile.arrayBuffer(),
          contentType: avatarFile.type,
        });

        currentStep = "avatar metadata update";
        logRegisterStep(requestId, "before avatar metadata update", {
          userId: user.id,
          avatarPath,
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
        logRegisterStep(requestId, "after avatar metadata update", {
          userId: user.id,
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

    return jsonResponse(requestId, body, 201);
  } catch (error) {
    const serializedError = serializeRegisterError(currentStep, error);

    console.error(`[register:${requestId}] catch`, {
      durationMs: Date.now() - startedAt,
      step: currentStep,
      error: serializedError,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return getRegisterErrorResponse(requestId, currentStep, error);
  }
}
