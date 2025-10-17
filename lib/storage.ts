import { getSupabaseAnonClient, getSupabaseServiceClient } from "@/lib/supabase/service";

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type FilePurpose =
  | "guide_license"
  | "guide_selfie"
  | "agency_logo"
  | "transport_fleet"
  | "chat_attachment"
  | "job_attachment";

type AllowlistRule = {
  mimeTypes: string[];
  maxFileSize?: number;
};

const purposeAllowlist: Record<FilePurpose, AllowlistRule> = {
  guide_license: {
    mimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFileSize: 10 * 1024 * 1024,
  },
  guide_selfie: {
    mimeTypes: ["image/jpeg", "image/png", "image/heic"],
    maxFileSize: 5 * 1024 * 1024,
  },
  agency_logo: {
    mimeTypes: ["image/svg+xml", "image/png", "image/jpeg"],
    maxFileSize: 2 * 1024 * 1024,
  },
  transport_fleet: {
    mimeTypes: ["image/jpeg", "image/png"],
    maxFileSize: 5 * 1024 * 1024,
  },
  chat_attachment: {
    mimeTypes: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxFileSize: 8 * 1024 * 1024,
  },
  job_attachment: {
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxFileSize: 5 * 1024 * 1024,
  },
};

export type ValidateUploadOptions = {
  purpose: FilePurpose;
  mimeType: string;
  sizeBytes: number;
};

export function validateUpload({ purpose, mimeType, sizeBytes }: ValidateUploadOptions) {
  const rule = purposeAllowlist[purpose];
  if (!rule) {
    return {
      ok: false as const,
      reason: `Unsupported file purpose: ${purpose}`,
    };
  }

  if (!rule.mimeTypes.includes(mimeType)) {
    return {
      ok: false as const,
      reason: `File type ${mimeType} is not allowed for ${purpose}`,
    };
  }

  const limit = rule.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  if (sizeBytes > limit) {
    const sizeMb = Math.round(limit / (1024 * 1024));
    return {
      ok: false as const,
      reason: `File exceeds limit of ${sizeMb}MB`,
    };
  }

  return { ok: true as const };
}

export type SignedUrlOptions = {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
  serviceRole?: boolean;
};

export async function createSignedDownloadUrl({
  bucket,
  path,
  expiresInSeconds = 60,
  serviceRole = false,
}: SignedUrlOptions) {
  const supabase = serviceRole ? getSupabaseServiceClient() : getSupabaseAnonClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) {
    throw error;
  }
  return data.signedUrl;
}

export type SignedUploadOptions = {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
};

export async function createSignedUploadUrl({
  bucket,
  path,
  expiresInSeconds = 60,
}: SignedUploadOptions) {
  const supabase = getSupabaseServiceClient();
  void expiresInSeconds; // Supabase createSignedUploadUrl currently exposes only upsert control
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: false });
  if (error) {
    throw error;
  }
  return data.signedUrl;
}







