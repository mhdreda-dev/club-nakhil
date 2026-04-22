import { NextRequest, NextResponse } from "next/server";

import {
  normalizeProfileUpdate,
  profileUpdateSchema,
} from "@/features/profiles/profiles.schemas";
import { getOwnProfile, updateOwnProfile } from "@/features/profiles/profiles.service";
import { requireApiAuth } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  try {
    const profile = await getOwnProfile(auth.session.user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid profile payload",
          errors: parsed.error.flatten(),
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.map((segment) => String(segment)),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const normalizedInput = normalizeProfileUpdate(parsed.data);
    normalizedInput.avatarUrl = undefined;
    normalizedInput.avatarPath = undefined;

    const profile = await updateOwnProfile(
      auth.session.user.id,
      auth.session.user.role,
      normalizedInput,
    );

    return NextResponse.json({ profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to update profile" }, { status: 500 });
  }
}
