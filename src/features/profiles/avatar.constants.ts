export const AVATAR_STORAGE_BUCKET = "avatars";

export const AVATAR_UPLOAD_FIELD = "file";

export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const AVATAR_FILE_INPUT_ACCEPT = AVATAR_ALLOWED_MIME_TYPES.join(",");

export const AVATAR_MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024;

export const AVATAR_STORAGE_REQUEST_TIMEOUT_MS = 10_000;
