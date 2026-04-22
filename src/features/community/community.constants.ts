export const COMMUNITY_POST_STORAGE_BUCKET =
  process.env.SUPABASE_COMMUNITY_POSTS_BUCKET?.trim() || "community-posts";

export const COMMUNITY_POST_IMAGE_UPLOAD_FIELD = "image";

export const COMMUNITY_POST_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const COMMUNITY_POST_FILE_INPUT_ACCEPT = COMMUNITY_POST_ALLOWED_MIME_TYPES.join(",");

export const COMMUNITY_POST_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
