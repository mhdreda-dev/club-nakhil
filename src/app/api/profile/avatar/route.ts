import { NextRequest, NextResponse } from "next/server";

import { AVATAR_UPLOAD_FIELD } from "@/features/profiles/avatar.constants";
import {
  AvatarUploadValidationError,
  uploadOwnAvatar,
} from "@/features/profiles/avatar.service";
import { requireApiAuth } from "@/lib/route-auth";

export const runtime = "nodejs";

function statusCodeFromAvatarError(error: unknown) {
  if (!(error instanceof Error)) {
    return 500;
  }

  if (error.message.includes("Profile not found")) {
    return 404;
  }

  if (error.message.includes("missing or inaccessible")) {
    return 500;
  }

  if (error.message.includes("Supabase configuration is missing")) {
    return 500;
  }

  return 500;
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const fileField = formData.get(AVATAR_UPLOAD_FIELD);

    if (!(fileField instanceof File)) {
      return NextResponse.json(
        { message: "Avatar file is required." },
        { status: 400 },
      );
    }

    const avatar = await uploadOwnAvatar(auth.session.user.id, fileField);

    return NextResponse.json({
      message: "Avatar uploaded successfully.",
      avatarUrl: avatar.avatarUrl,
      avatarPath: avatar.avatarPath,
    });
  } catch (error) {
    if (error instanceof AvatarUploadValidationError) {
      return NextResponse.json(
        {
          message: "Invalid avatar upload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error(error);

    const status = statusCodeFromAvatarError(error);
    const errorDetails = error instanceof Error ? error.message : "Unknown upload error";

    return NextResponse.json(
      {
        message: "Unable to upload avatar.",
        details: errorDetails,
      },
      { status },
    );
  }
}
