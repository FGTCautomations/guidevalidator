import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

/**
 * Export Database to Excel
 *
 * This endpoint exports all profiles, guides, and agencies to an Excel file
 * for admin download and backup purposes.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Database export API called");

    // Verify admin authentication
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("Export: Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      console.log("Export: Forbidden - not admin", profile?.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = getSupabaseServiceClient();

    // Fetch all data with pagination to avoid limits
    console.log("Fetching all data from database...");

    // Fetch all auth users (paginated)
    let allAuthUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    let hasMore = true;

    while (hasMore) {
      const authUsersResult = await serviceClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (authUsersResult.error) {
        throw new Error(`Failed to fetch auth users: ${authUsersResult.error.message}`);
      }

      allAuthUsers = allAuthUsers.concat(authUsersResult.data.users);
      hasMore = authUsersResult.data.users.length === perPage;
      page++;
    }

    console.log(`Fetched ${allAuthUsers.length} auth users`);

    // Fetch all profiles with pagination
    let allProfiles: any[] = [];
    let profilesFrom = 0;
    const chunkSize = 1000;
    let hasMoreProfiles = true;

    while (hasMoreProfiles) {
      const { data, error } = await serviceClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range(profilesFrom, profilesFrom + chunkSize - 1);

      if (error) {
        throw new Error(`Failed to fetch profiles: ${error.message}`);
      }

      allProfiles = allProfiles.concat(data || []);
      hasMoreProfiles = (data?.length || 0) === chunkSize;
      profilesFrom += chunkSize;
    }

    console.log(`Fetched ${allProfiles.length} profiles`);

    // Fetch all guides with pagination
    let allGuides: any[] = [];
    let guidesFrom = 0;
    let hasMoreGuides = true;

    while (hasMoreGuides) {
      const { data, error } = await serviceClient
        .from("guides")
        .select("*")
        .order("created_at", { ascending: false })
        .range(guidesFrom, guidesFrom + chunkSize - 1);

      if (error) {
        throw new Error(`Failed to fetch guides: ${error.message}`);
      }

      allGuides = allGuides.concat(data || []);
      hasMoreGuides = (data?.length || 0) === chunkSize;
      guidesFrom += chunkSize;
    }

    console.log(`Fetched ${allGuides.length} guides`);

    // Fetch all agencies with pagination
    let allAgencies: any[] = [];
    let agenciesFrom = 0;
    let hasMoreAgencies = true;

    while (hasMoreAgencies) {
      const { data, error } = await serviceClient
        .from("agencies")
        .select("*")
        .order("created_at", { ascending: false })
        .range(agenciesFrom, agenciesFrom + chunkSize - 1);

      if (error) {
        throw new Error(`Failed to fetch agencies: ${error.message}`);
      }

      allAgencies = allAgencies.concat(data || []);
      hasMoreAgencies = (data?.length || 0) === chunkSize;
      agenciesFrom += chunkSize;
    }

    console.log(`Fetched ${allAgencies.length} agencies`);

    // Create result objects for compatibility with existing code
    const authUsers = allAuthUsers;
    const profiles = allProfiles || [];
    const guides = allGuides || [];
    const agencies = allAgencies || [];

    console.log(`Exporting: ${authUsers.length} auth users, ${profiles.length} profiles, ${guides.length} guides, ${agencies.length} agencies`);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Guide Validator Admin";
    workbook.created = new Date();

    // Create a map of auth users for lookup
    const authUserMap = new Map(authUsers.map(u => [u.id, u]));

    // Create a map of profiles for lookup
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // ========================================================================
    // GUIDES SHEET
    // ========================================================================
    const guidesSheet = workbook.addWorksheet("Guides");
    guidesSheet.columns = [
      { header: "Email", key: "email", width: 30 },
      { header: "Full Name", key: "full_name", width: 25 },
      { header: "Country Code", key: "country_code", width: 15 },
      { header: "Contact Email", key: "contact_email", width: 30 },
      { header: "Contact Phone", key: "contact_phone", width: 20 },
      { header: "Timezone", key: "timezone", width: 25 },
      { header: "Headline", key: "headline", width: 40 },
      { header: "Bio", key: "bio", width: 50 },
      { header: "Years Experience", key: "years_experience", width: 18 },
      { header: "Specialties", key: "specialties", width: 30 },
      { header: "Languages", key: "languages", width: 30 },
      { header: "License Number", key: "license_number", width: 20 },
      { header: "License Authority", key: "license_authority", width: 20 },
      { header: "Hourly Rate (cents)", key: "hourly_rate_cents", width: 20 },
      { header: "Currency", key: "currency", width: 12 },
      { header: "Gender", key: "gender", width: 12 },
      { header: "Has Liability Insurance", key: "has_liability_insurance", width: 22 },
      { header: "Response Time (minutes)", key: "response_time_minutes", width: 22 },
      { header: "Status", key: "status", width: 15 },
      { header: "Profile Completion Link", key: "completion_link", width: 80 },
      { header: "Created At", key: "created_at", width: 20 },
    ];

    // Style header row
    guidesSheet.getRow(1).font = { bold: true };
    guidesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add guide data
    guides.forEach((guide) => {
      const profile = profileMap.get(guide.profile_id);
      const authUser = authUserMap.get(guide.profile_id);
      const appData = guide.application_data || {};

      guidesSheet.addRow({
        email: authUser?.email || "",
        full_name: profile?.full_name || "",
        country_code: profile?.country_code || "",
        contact_email: appData.contact_email || "",
        contact_phone: appData.contact_phone || "",
        timezone: guide.timezone || "",
        headline: guide.headline || "",
        bio: guide.bio || "",
        years_experience: guide.years_experience || "",
        specialties: Array.isArray(guide.specialties) ? guide.specialties.join(", ") : "",
        languages: Array.isArray(guide.spoken_languages) ? guide.spoken_languages.join(", ") : "",
        license_number: guide.license_number || "",
        license_authority: guide.license_authority || "",
        hourly_rate_cents: appData.hourly_rate_cents || "",
        currency: appData.currency || "USD",
        gender: appData.gender || "",
        has_liability_insurance: appData.has_liability_insurance ? "Yes" : "No",
        response_time_minutes: appData.response_time_minutes || "",
        status: profile?.application_status || "",
        completion_link: appData.profile_completion_link || "",
        created_at: profile?.created_at ? new Date(profile.created_at).toLocaleString() : "",
      });
    });

    // ========================================================================
    // AGENCIES SHEET (includes agencies, DMCs, and transport)
    // ========================================================================
    const agenciesSheet = workbook.addWorksheet("Organizations");
    agenciesSheet.columns = [
      { header: "Email", key: "email", width: 30 },
      { header: "Type", key: "type", width: 15 },
      { header: "Name", key: "name", width: 30 },
      { header: "Country Code", key: "country_code", width: 15 },
      { header: "Contact Email", key: "contact_email", width: 30 },
      { header: "Contact Phone", key: "contact_phone", width: 20 },
      { header: "Timezone", key: "timezone", width: 25 },
      { header: "Website", key: "website", width: 40 },
      { header: "Description", key: "description", width: 50 },
      { header: "Registration Number", key: "registration_number", width: 25 },
      { header: "VAT ID", key: "vat_id", width: 20 },
      { header: "Languages", key: "languages", width: 30 },
      { header: "Specialties", key: "specialties", width: 30 },
      { header: "Coverage Summary", key: "coverage_summary", width: 40 },
      { header: "Verified", key: "verified", width: 12 },
      { header: "Featured", key: "featured", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Profile Completion Link", key: "completion_link", width: 80 },
      { header: "Created At", key: "created_at", width: 20 },
    ];

    // Style header row
    agenciesSheet.getRow(1).font = { bold: true };
    agenciesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add agency data
    agencies.forEach((agency) => {
      const profile = profileMap.get(agency.id);
      const authUser = authUserMap.get(agency.id);
      const appData = agency.application_data || {};

      agenciesSheet.addRow({
        email: authUser?.email || "",
        type: agency.type || "",
        name: agency.name || "",
        country_code: agency.country_code || "",
        contact_email: appData.contact_email || "",
        contact_phone: appData.contact_phone || "",
        timezone: agency.timezone || "",
        website: agency.website || "",
        description: agency.description || "",
        registration_number: agency.registration_number || "",
        vat_id: agency.vat_id || "",
        languages: Array.isArray(agency.languages) ? agency.languages.join(", ") : "",
        specialties: Array.isArray(agency.specialties) ? agency.specialties.join(", ") : "",
        coverage_summary: agency.coverage_summary || "",
        verified: agency.verified ? "Yes" : "No",
        featured: agency.featured ? "Yes" : "No",
        status: profile?.application_status || "",
        completion_link: appData.profile_completion_link || "",
        created_at: agency.created_at ? new Date(agency.created_at).toLocaleString() : "",
      });
    });

    // ========================================================================
    // ALL PROFILES SHEET
    // ========================================================================
    const allProfilesSheet = workbook.addWorksheet("All Profiles");
    allProfilesSheet.columns = [
      { header: "Email", key: "email", width: 30 },
      { header: "Full Name", key: "full_name", width: 25 },
      { header: "Role", key: "role", width: 15 },
      { header: "Country Code", key: "country_code", width: 15 },
      { header: "Timezone", key: "timezone", width: 25 },
      { header: "Locale", key: "locale", width: 12 },
      { header: "Application Status", key: "status", width: 20 },
      { header: "Organization ID", key: "organization_id", width: 40 },
      { header: "Created At", key: "created_at", width: 20 },
    ];

    // Style header row
    allProfilesSheet.getRow(1).font = { bold: true };
    allProfilesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add profile data
    profiles.forEach((profile) => {
      const authUser = authUserMap.get(profile.id);

      allProfilesSheet.addRow({
        email: authUser?.email || "",
        full_name: profile.full_name || "",
        role: profile.role || "",
        country_code: profile.country_code || "",
        timezone: profile.timezone || "",
        locale: profile.locale || "",
        status: profile.application_status || "",
        organization_id: profile.organization_id || "",
        created_at: profile.created_at ? new Date(profile.created_at).toLocaleString() : "",
      });
    });

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `guide-validator-database-export-${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String((buffer as unknown as Buffer).length),
      },
    });
  } catch (error) {
    console.error("Database export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
