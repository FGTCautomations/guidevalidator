import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";

import { getSupabaseServiceClient } from "@/lib/supabase/service";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ensuredBuckets = new Set<string>();

type UploadImageOptions = {
  bucket: string;
  folder: string;
  makePublic?: boolean;
  maxFileSizeBytes?: number;
};

export type UploadImageResult = {
  path: string;
  publicUrl: string | null;
};

async function ensureBucketExists(bucket: string, makePublic: boolean) {
  if (ensuredBuckets.has(bucket)) {
    return;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (data && !error) {
    ensuredBuckets.add(bucket);
    if (!!data.public !== !!makePublic) {
      await supabase.storage.updateBucket(bucket, { public: makePublic });
    }
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, { public: makePublic });
  if (createError && !/(already exists|bucket_exists)/i.test(createError.message ?? "")) {
    throw createError;
  }

  ensuredBuckets.add(bucket);
}

function inferExtension(file: File) {
  const name = file.name ?? "";
  const fromName = name.includes(".") ? name.split(".").pop() : undefined;
  if (fromName && /^[a-zA-Z0-9]+$/.test(fromName)) {
    return fromName.toLowerCase();
  }
  const mime = file.type || "image";
  const subtype = mime.includes("/") ? mime.split("/").pop() ?? "" : mime;
  return subtype.replace(/[^a-zA-Z0-9]/g, "") || "img";
}

function normaliseFolder(folder: string) {
  return folder.replace(/^\/+/, "").replace(/\/+/g, "/").replace(/\/$/, "");
}

export async function uploadImageFile(
  file: File | Blob | null,
  { bucket, folder, makePublic = false, maxFileSizeBytes = DEFAULT_MAX_BYTES }: UploadImageOptions
): Promise<UploadImageResult | null> {
  if (!file) {
    return null;
  }

  const size = "size" in file ? (file as File).size : 0;
  if (!size) {
    return null;
  }

  const mimeType = "type" in file ? (file as File).type : "";
  if (!mimeType.startsWith("image/")) {
    throw new Error("Only image uploads are allowed.");
  }

  if (size > maxFileSizeBytes) {
    const limitMb = Math.round((maxFileSizeBytes / (1024 * 1024)) * 10) / 10;
    throw new Error(`Image must be smaller than ${limitMb}MB.`);
  }

  await ensureBucketExists(bucket, makePublic);

  const supabase = getSupabaseServiceClient();
  const safeFolder = normaliseFolder(folder);
  const extension = inferExtension(file as File);
  const objectPath = `${safeFolder}/${randomUUID()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const attemptUpload = async () =>
    supabase.storage.from(bucket).upload(objectPath, buffer, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  let { error } = await attemptUpload();
  if (error && /does not exist/i.test(error.message ?? "")) {
    ensuredBuckets.delete(bucket);
    await ensureBucketExists(bucket, makePublic);
    ({ error } = await attemptUpload());
  }

  if (error) {
    throw error;
  }

  let publicUrl: string | null = null;
  if (makePublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    publicUrl = data.publicUrl;
  }

  return { path: objectPath, publicUrl };
}
