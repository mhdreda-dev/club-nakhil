import { AVATAR_STORAGE_BUCKET } from "@/features/profiles/avatar.constants";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type UploadAvatarObjectInput = {
  path: string;
  data: ArrayBuffer;
  contentType: string;
};

let verifiedAvatarBucket = false;

async function ensureAvatarBucketExists() {
  if (verifiedAvatarBucket) {
    return;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.storage.getBucket(AVATAR_STORAGE_BUCKET);

  if (error || !data) {
    const reason = error?.message ?? "Bucket not found";
    throw new Error(
      `Supabase storage bucket "${AVATAR_STORAGE_BUCKET}" is missing or inaccessible: ${reason}`,
    );
  }

  verifiedAvatarBucket = true;
}

export async function uploadAvatarObject(input: UploadAvatarObjectInput) {
  await ensureAvatarBucketExists();

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.storage.from(AVATAR_STORAGE_BUCKET).upload(input.path, input.data, {
    contentType: input.contentType,
    upsert: false,
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(AVATAR_STORAGE_BUCKET).getPublicUrl(input.path);

  return data.publicUrl;
}

export async function removeAvatarObject(path: string) {
  const normalizedPath = path.replace(/^\/+/, "");

  if (!normalizedPath.length) {
    return;
  }

  await ensureAvatarBucketExists();

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.storage.from(AVATAR_STORAGE_BUCKET).remove([normalizedPath]);

  if (error) {
    throw new Error(`Avatar cleanup failed: ${error.message}`);
  }
}
