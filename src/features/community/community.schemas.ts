import {
  CommunityPostCategory,
  CommunityPostType,
  CommunityReactionType,
} from "@prisma/client";
import { z } from "zod";

import {
  COMMUNITY_POST_ALLOWED_MIME_TYPES,
  COMMUNITY_POST_MAX_FILE_SIZE_BYTES,
} from "@/features/community/community.constants";

const communityMimeTypeSet = new Set<string>(COMMUNITY_POST_ALLOWED_MIME_TYPES);

const communityImageMetadataSchema = z
  .object({
    name: z.string().min(1).max(220),
    type: z.string().min(1),
    size: z
      .number()
      .int()
      .positive()
      .max(
        COMMUNITY_POST_MAX_FILE_SIZE_BYTES,
        `Image is too large. Maximum file size is ${Math.round(COMMUNITY_POST_MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB.`,
      ),
  })
  .superRefine((data, context) => {
    if (!communityMimeTypeSet.has(data.type)) {
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

export const communityPostCreateSchema = z.object({
  postType: z.nativeEnum(CommunityPostType),
  caption: z
    .string()
    .trim()
    .min(2, "Please add a caption before posting.")
    .max(600, "Caption is too long."),
});

export const communityCommentCreateSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(500, "Comment is too long."),
});

export const communityReactionToggleSchema = z.object({
  reaction: z.enum(["like", "fire", "clap"]),
});

export const communityModerationActionSchema = z.object({
  action: z.enum(["HIDE", "DELETE", "PIN", "UNPIN"]),
});

export function validateCommunityPostImage(file: File) {
  return communityImageMetadataSchema.safeParse({
    name: file.name,
    type: file.type,
    size: file.size,
  });
}

function sanitizeUserIdSegment(userId: string) {
  const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();

  if (!sanitized.length) {
    throw new Error("Invalid user id for community image path");
  }

  return sanitized;
}

export function buildCommunityPostImagePath(userId: string, mimeType: string) {
  const extension = extensionByMimeType[mimeType];

  if (!extension) {
    throw new Error("Cannot determine file extension for community post image");
  }

  const safeUserId = sanitizeUserIdSegment(userId);
  const timestamp = Date.now();
  const nonce = crypto.randomUUID().slice(0, 8);

  return `${safeUserId}/community-${timestamp}-${nonce}.${extension}`;
}

export function categoryFromPostType(postType: CommunityPostType): CommunityPostCategory {
  if (postType === CommunityPostType.ACHIEVEMENT) {
    return CommunityPostCategory.ACHIEVEMENTS;
  }

  if (postType === CommunityPostType.SUPPORT) {
    return CommunityPostCategory.EVENTS;
  }

  return CommunityPostCategory.TRAINING;
}

export function reactionTypeFromKey(
  reaction: z.infer<typeof communityReactionToggleSchema>["reaction"],
) {
  if (reaction === "like") return CommunityReactionType.LIKE;
  if (reaction === "fire") return CommunityReactionType.FIRE;
  return CommunityReactionType.CLAP;
}
