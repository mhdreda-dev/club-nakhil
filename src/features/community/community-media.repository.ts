import { COMMUNITY_POST_STORAGE_BUCKET } from "@/features/community/community.constants";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type UploadCommunityPostImageInput = {
  path: string;
  data: ArrayBuffer;
  contentType: string;
};

let verifiedCommunityPostBucket = false;

async function ensureCommunityPostBucketExists() {
  if (verifiedCommunityPostBucket) {
    return;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.storage.getBucket(COMMUNITY_POST_STORAGE_BUCKET);

  if (error || !data) {
    const reason = error?.message ?? "Bucket not found";
    throw new Error(
      `Supabase storage bucket "${COMMUNITY_POST_STORAGE_BUCKET}" is missing or inaccessible: ${reason}`,
    );
  }

  verifiedCommunityPostBucket = true;
}

export async function uploadCommunityPostImage(input: UploadCommunityPostImageInput) {
  await ensureCommunityPostBucketExists();

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.storage.from(COMMUNITY_POST_STORAGE_BUCKET).upload(input.path, input.data, {
    contentType: input.contentType,
    upsert: false,
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(`Community post image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(COMMUNITY_POST_STORAGE_BUCKET).getPublicUrl(input.path);
  return data.publicUrl;
}

export async function removeCommunityPostImage(path: string) {
  const normalizedPath = path.replace(/^\/+/, "");

  if (!normalizedPath.length) {
    return;
  }

  await ensureCommunityPostBucketExists();

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.storage.from(COMMUNITY_POST_STORAGE_BUCKET).remove([normalizedPath]);

  if (error) {
    throw new Error(`Community post image cleanup failed: ${error.message}`);
  }
}
