import {
  buildAvatarStoragePath,
  validateAvatarFile,
} from "@/features/profiles/avatar.schemas";
import {
  removeAvatarObject,
  uploadAvatarObject,
} from "@/features/profiles/avatar.repository";
import {
  getUserProfileAvatar,
  updateUserProfileAvatar,
} from "@/features/profiles/profiles.repository";
import { ensureProfile, invalidateProfileSummary } from "@/features/profiles/profiles.service";

export class AvatarUploadValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super("Invalid avatar upload");
    this.issues = issues;
  }
}

function shouldCleanupOldAvatarPath(path: string, userId: string) {
  const normalizedPath = path.replace(/^\/+/, "");

  if (!normalizedPath.length) {
    return false;
  }

  // Seeded avatars are static assets, not Supabase objects.
  if (normalizedPath.startsWith("seed/avatars/")) {
    return false;
  }

  // We only clean up paths that look like user-owned uploads in the bucket.
  const normalizedUserSegment = userId.toLowerCase();
  return normalizedPath.startsWith(`${normalizedUserSegment}/`);
}

export async function uploadOwnAvatar(userId: string, file: File) {
  const parsed = validateAvatarFile(file);

  if (!parsed.success) {
    throw new AvatarUploadValidationError(parsed.error.issues.map((issue) => issue.message));
  }

  await ensureProfile(userId);

  const currentAvatar = await getUserProfileAvatar(userId);

  if (!currentAvatar) {
    throw new Error("Profile not found for avatar update");
  }

  const avatarPath = buildAvatarStoragePath(userId, parsed.data.type);
  const avatarUrl = await uploadAvatarObject({
    path: avatarPath,
    data: await file.arrayBuffer(),
    contentType: parsed.data.type,
  });

  const updatedAvatar = await updateUserProfileAvatar(userId, {
    avatarPath,
    avatarUrl,
  });

  // The cached layout/sidebar payload includes avatarUrl. Drop it so the
  // next layout render shows the new avatar without waiting for the TTL.
  await invalidateProfileSummary(userId);

  if (
    currentAvatar.avatarPath &&
    currentAvatar.avatarPath !== avatarPath &&
    shouldCleanupOldAvatarPath(currentAvatar.avatarPath, userId)
  ) {
    removeAvatarObject(currentAvatar.avatarPath).catch((error) => {
      console.error("Avatar cleanup warning:", error);
    });
  }

  return updatedAvatar;
}
