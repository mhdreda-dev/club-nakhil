import { z } from "zod";

import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_FILE_SIZE_BYTES,
} from "@/features/profiles/avatar.constants";

const avatarMimeTypeSet = new Set<string>(AVATAR_ALLOWED_MIME_TYPES);

const avatarFileSchema = z
  .object({
    name: z.string().min(1).max(200),
    type: z.string().min(1),
    size: z
      .number()
      .int()
      .positive()
      .max(
        AVATAR_MAX_FILE_SIZE_BYTES,
        `Image is too large. Maximum file size is ${Math.round(AVATAR_MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB.`,
      ),
  })
  .superRefine((data, context) => {
    if (!avatarMimeTypeSet.has(data.type)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["type"],
        message: "Unsupported image format. Use JPG, PNG, or WEBP.",
      });
    }
  });

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type AvatarFileMetadata = z.infer<typeof avatarFileSchema>;

export function validateAvatarFile(file: File) {
  return avatarFileSchema.safeParse({
    name: file.name,
    type: file.type,
    size: file.size,
  });
}

export function extensionFromMimeType(mimeType: string) {
  return extensionByMimeType[mimeType];
}

function sanitizeUserIdSegment(userId: string) {
  const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();

  if (!sanitized.length) {
    throw new Error("Invalid user id for avatar path");
  }

  return sanitized;
}

export function buildAvatarStoragePath(userId: string, mimeType: string) {
  const extension = extensionFromMimeType(mimeType);

  if (!extension) {
    throw new Error("Cannot determine file extension for avatar");
  }

  const safeUserId = sanitizeUserIdSegment(userId);
  const timestamp = Date.now();
  const nonce = crypto.randomUUID().slice(0, 8);

  return `${safeUserId}/avatar-${timestamp}-${nonce}.${extension}`;
}
