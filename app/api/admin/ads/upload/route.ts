export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAccess } from "@/lib/admin/queries";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  console.log("[Upload] Starting file upload process");

  try {
    // Check admin authorization
    console.log("[Upload] Checking admin access");
    const { authorized } = await checkAdminAccess();

    if (!authorized) {
      console.log("[Upload] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the uploaded file
    console.log("[Upload] Parsing form data");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log("[Upload] File received:", file ? file.name : "no file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    console.log("[Upload] File type:", file.type, "Size:", file.size);
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      console.log("[Upload] Invalid file type");
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log("[Upload] File too large");
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const filename = `ad-${timestamp}-${randomString}.${extension}`;
    console.log("[Upload] Generated filename:", filename);

    // Convert file to buffer
    console.log("[Upload] Converting file to buffer");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("[Upload] Buffer size:", buffer.length);

    // Upload to Supabase Storage
    console.log("[Upload] Uploading to Supabase Storage");
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase.storage
      .from("ads")
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[Upload] Error uploading to Supabase Storage:", error);
      return NextResponse.json(
        { error: `Failed to upload image: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("[Upload] Upload successful, data:", data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("ads").getPublicUrl(filename);

    console.log("[Upload] Public URL:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("[Upload] Error in upload route:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
