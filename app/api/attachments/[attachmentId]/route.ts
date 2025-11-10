export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    const supabase = getSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get attachment details
    const { data: attachment, error: attachmentError } = await supabase
      .from("message_attachments")
      .select(
        `
        *,
        message:messages!inner (
          conversation_id
        )
      `
      )
      .eq("id", params.attachmentId)
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Check if user is a participant in the conversation
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", (attachment.message as any).conversation_id)
      .eq("profile_id", user.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get signed URL from storage
    if (!attachment.storage_path) {
      return NextResponse.json({ error: "Storage path not found" }, { status: 404 });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("message-attachments")
      .createSignedUrl(attachment.storage_path, 3600); // 1 hour

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    // Redirect to signed URL
    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error("Attachment retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
