export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const token = formData.get("token") as string | null;
    const guideId = formData.get("guideId") as string;
    const profileId = formData.get("profileId") as string;

    // Personal information
    const fullName = formData.get("fullName") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const nationality = formData.get("nationality") as string;
    const contactPhone = formData.get("contactPhone") as string;
    const cityOfResidence = formData.get("cityOfResidence") as string;

    // Official license
    const licenseNumber = formData.get("licenseNumber") as string;
    const licenseAuthority = formData.get("licenseAuthority") as string;
    const licenseProof = formData.get("licenseProof") as File | null;
    const idDocument = formData.get("idDocument") as File | null;

    // Specialisations & expertise
    const languages = JSON.parse(formData.get("languages") as string || "[]");
    const specializations = JSON.parse(formData.get("specializations") as string || "[]");
    const expertiseAreas = JSON.parse(formData.get("expertiseAreas") as string || "[]");
    const locationData = JSON.parse(formData.get("locationData") as string || "{}");

    // Profile & portfolio
    const profilePhoto = formData.get("profilePhoto") as File | null;
    const professionalIntro = formData.get("professionalIntro") as string;
    const experienceYears = formData.get("experienceYears") as string;
    const experienceSummary = formData.get("experienceSummary") as string;
    const sampleItineraries = formData.get("sampleItineraries") as string;
    const mediaGallery = formData.get("mediaGallery") as string;

    // Availability & contact
    const timezone = formData.get("timezone") as string;
    const availabilityTimezone = formData.get("availabilityTimezone") as string;
    const workingHours = JSON.parse(formData.get("workingHours") as string || "{}");
    const availabilityNotes = formData.get("availabilityNotes") as string;
    const contactMethods = formData.get("contactMethods") as string;

    // Subscription & billing
    const billingNotes = formData.get("billingNotes") as string;

    if (!guideId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();

    // Verify token only if provided (token is optional for claimed profiles)
    if (token) {
      const { data: guide, error: fetchError } = await serviceClient
        .from("guides")
        .select("application_data")
        .eq("profile_id", guideId)
        .single();

      if (fetchError || !guide) {
        return NextResponse.json({ error: "Guide not found" }, { status: 404 });
      }

      const appData = guide.application_data || {};
      if (appData.profile_completion_token !== token) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
      }
    }

    // Upload files to Supabase Storage if provided
    let licenseProofUrl = null;
    let idDocumentUrl = null;
    let profilePhotoUrl = null;

    if (licenseProof && licenseProof.size > 0) {
      const fileExt = licenseProof.name.split('.').pop();
      const fileName = `${guideId}_license_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await serviceClient.storage
        .from('guide-documents')
        .upload(fileName, licenseProof, {
          contentType: licenseProof.type,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = serviceClient.storage
          .from('guide-documents')
          .getPublicUrl(uploadData.path);
        licenseProofUrl = urlData.publicUrl;
      }
    }

    if (idDocument && idDocument.size > 0) {
      const fileExt = idDocument.name.split('.').pop();
      const fileName = `${guideId}_id_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await serviceClient.storage
        .from('guide-documents')
        .upload(fileName, idDocument, {
          contentType: idDocument.type,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = serviceClient.storage
          .from('guide-documents')
          .getPublicUrl(uploadData.path);
        idDocumentUrl = urlData.publicUrl;
      }
    }

    if (profilePhoto && profilePhoto.size > 0) {
      const fileExt = profilePhoto.name.split('.').pop();
      const fileName = `${guideId}_profile_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await serviceClient.storage
        .from('profile-photos')
        .upload(fileName, profilePhoto, {
          contentType: profilePhoto.type,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = serviceClient.storage
          .from('profile-photos')
          .getPublicUrl(uploadData.path);
        profilePhotoUrl = urlData.publicUrl;
      }
    }

    // Parse itineraries from text input
    const parsedItineraries = sampleItineraries
      ? sampleItineraries
          .split("\n")
          .filter((line: string) => line.trim())
          .map((line: string) => {
            const [title, url] = line.split("|").map((s: string) => s.trim());
            return { title: title || "", url: url || "" };
          })
      : [];

    // Parse media gallery from text input
    const parsedMedia = mediaGallery
      ? mediaGallery
          .split("\n")
          .filter((line: string) => line.trim())
          .map((line: string) => {
            const [title, url] = line.split("|").map((s: string) => s.trim());
            return { title: title || "", url: url || "" };
          })
      : [];

    // Parse contact methods from text input
    const parsedContactMethods = contactMethods
      ? contactMethods
          .split("\n")
          .filter((line: string) => line.trim())
          .map((line: string) => {
            const [channel, value] = line.split("|").map((s: string) => s.trim());
            return { channel: channel || "", value: value || "" };
          })
      : [];

    // Update guide record with all fields
    const guideUpdateData: any = {
      professional_intro: professionalIntro || null,
      years_experience: parseInt(experienceYears) || null,
      experience_summary: experienceSummary || null,
      sample_itineraries: JSON.stringify({ entries: parsedItineraries }),
      media_gallery: JSON.stringify({ entries: parsedMedia }),
      timezone: timezone || null,
      availability_timezone: availabilityTimezone || null,
      working_hours: workingHours || null,
      availability_notes: availabilityNotes || null,
      contact_methods: JSON.stringify(parsedContactMethods),
      spoken_languages: Array.isArray(languages) ? languages : [],
      specialties: Array.isArray(specializations) ? specializations : [],
      expertise_areas: Array.isArray(expertiseAreas) ? expertiseAreas : [],
      location_data: locationData || null,
      license_number: licenseNumber || null,
      license_authority: licenseAuthority || null,
      updated_at: new Date().toISOString(),
    };

    // Add file URLs if they were uploaded
    if (licenseProofUrl) {
      guideUpdateData.license_proof_url = licenseProofUrl;
    }
    if (idDocumentUrl) {
      guideUpdateData.id_document_url = idDocumentUrl;
    }
    if (profilePhotoUrl) {
      guideUpdateData.profile_photo_url = profilePhotoUrl;
    }

    const { error: updateGuideError } = await serviceClient
      .from("guides")
      .update(guideUpdateData)
      .eq("profile_id", guideId);

    if (updateGuideError) {
      console.error("Failed to update guide:", updateGuideError);
      return NextResponse.json({ error: "Failed to update guide profile" }, { status: 500 });
    }

    // Update profile record with personal information
    const profileUpdateData: any = {
      full_name: fullName || null,
      country_code: nationality || null,
      phone: contactPhone || null,
      updated_at: new Date().toISOString(),
    };

    if (profilePhotoUrl) {
      profileUpdateData.avatar_url = profilePhotoUrl;
    }

    const { error: updateProfileError } = await serviceClient
      .from("profiles")
      .update(profileUpdateData)
      .eq("id", profileId);

    if (updateProfileError) {
      console.error("Failed to update profile:", updateProfileError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Mark token as used (optional - you can remove the token or mark it)
    // For now, we'll leave it in place so they can re-edit if needed

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile completion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
