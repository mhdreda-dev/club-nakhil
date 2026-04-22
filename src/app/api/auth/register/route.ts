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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const avatarField = formData.get("profileImage");
    const avatarFile =
      avatarField instanceof File && avatarField.size > 0 ? avatarField : null;

    if (avatarFile) {
      const parsedAvatar = validateAvatarFile(avatarFile);

      if (!parsedAvatar.success) {
        return NextResponse.json(
          {
            message: "Invalid profile image.",
            fieldErrors: {
              profileImage: parsedAvatar.error.issues[0]?.message ?? "Invalid image file.",
            },
          },
          { status: 400 },
        );
      }
    }

    const parsed = memberRegistrationSchema.safeParse({
      fullName: getStringField(formData, "fullName"),
      email: getStringField(formData, "email"),
      phone: getStringField(formData, "phone"),
      password: getStringField(formData, "password"),
      confirmPassword: getStringField(formData, "confirmPassword"),
      dateOfBirth: getStringField(formData, "dateOfBirth"),
      gender: getStringField(formData, "gender"),
      address: getStringField(formData, "address"),
      emergencyContact: getStringField(formData, "emergencyContact"),
      sportLevel: getStringField(formData, "sportLevel"),
      membershipType: getStringField(formData, "membershipType"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please correct the highlighted fields.",
          fieldErrors: mapIssuesToFieldErrors(parsed.error.issues),
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "This email is already registered.",
          fieldErrors: {
            email: "An account with this email already exists.",
          },
        },
        { status: 409 },
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const dateOfBirth = new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: parsed.data.fullName,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          passwordHash,
          role: Role.MEMBER,
          status: AccountStatus.PENDING,
          phone: parsed.data.phone,
          dateOfBirth,
          gender: parsed.data.gender,
          address: parsed.data.address,
          emergencyContact: parsed.data.emergencyContact,
          sportLevel: parsed.data.sportLevel,
          membershipType: parsed.data.membershipType,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: createdUser.id,
          fullName: parsed.data.fullName,
          displayName: parsed.data.fullName,
          phone: parsed.data.phone,
          dateOfBirth,
          gender: parsed.data.gender,
          address: parsed.data.address,
          emergencyContact: parsed.data.emergencyContact,
          joinedAt: createdUser.createdAt,
        },
      });

      await tx.memberProfile.create({
        data: {
          userId: createdUser.id,
          trainingLevel: parsed.data.sportLevel,
        },
      });

      return createdUser;
    });

    let avatarWarning: string | null = null;

    if (avatarFile) {
      try {
        const avatarPath = buildAvatarStoragePath(user.id, avatarFile.type);
        const avatarUrl = await uploadAvatarObject({
          path: avatarPath,
          data: await avatarFile.arrayBuffer(),
          contentType: avatarFile.type,
        });

        await prisma.$transaction([
          prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              profileImage: avatarUrl,
            },
          }),
          prisma.userProfile.update({
            where: {
              userId: user.id,
            },
            data: {
              avatarUrl,
              avatarPath,
            },
          }),
        ]);
      } catch (error) {
        console.error("Avatar upload warning during registration:", error);
        avatarWarning = "Your account was created, but the profile image could not be uploaded.";
      }
    }

    notifyAdminsOfPendingMember({
      memberId: user.id,
      fullName: parsed.data.fullName,
      email: user.email,
    }).catch((notificationError) => {
      console.error("Admin notification warning after registration:", notificationError);
    });

    return NextResponse.json(
      {
        message: "Registration submitted. Your account is waiting for admin approval.",
        pending: true,
        email: user.email,
        warning: avatarWarning,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to complete sign up right now.",
      },
      { status: 500 },
    );
  }
}
