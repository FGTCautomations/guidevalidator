"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { SupportedLocale } from "@/i18n/config";
import { DeleteUserModal } from "./delete-user-modal";
import { ToastNotification } from "./toast-notification";

type ApplicationStatus = "pending" | "approved" | "rejected";

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  country_code: string | null;
  timezone: string | null;
  avatar_url: string | null;
  verified: boolean;
  license_verified: boolean;
  application_status: ApplicationStatus;
  application_submitted_at: string | null;
  application_reviewed_at: string | null;
  application_reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface Guide {
  profile_id: string;
  headline: string | null;
  bio: string | null;
  professional_intro: string | null;
  specialties: string[];
  expertise_areas: string[];
  spoken_languages: string[];
  years_experience: number | null;
  license_number: string | null;
  license_authority: string | null;
  hourly_rate_cents: number | null;
  currency: string | null;
  application_data: any;
  location_data: any;
  created_at: string;
  updated_at: string;
  profiles: UserProfile;
}

interface Agency {
  id: string;
  type: "agency" | "dmc" | "transport";
  name: string;
  slug: string;
  registration_country: string | null;
  registration_number: string | null;
  vat_id: string | null;
  country_code: string | null;
  description: string | null;
  website_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  services_offered: string[];
  service_types: string[];
  languages_supported: string[];
  certifications: string[];
  verified: boolean;
  application_status: ApplicationStatus;
  application_submitted_at: string | null;
  application_reviewed_at: string | null;
  application_reviewed_by: string | null;
  rejection_reason: string | null;
  application_data: any;
  location_data: any;
  fleet_data: any;
  coverage_summary: string | null;
  timezone: string | null;
  availability_timezone: string | null;
  working_hours: any;
  availability_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UsersManagerProps {
  locale: SupportedLocale;
  users: {
    guides: Guide[];
    agencies: Agency[];
    dmcs: Agency[];
    transport: Agency[];
  };
}

type UserType = "guides" | "agencies" | "dmcs" | "transport";

export function UsersManager({ locale, users }: UsersManagerProps) {
  const [selectedTab, setSelectedTab] = useState<UserType>("guides");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "frozen">("all");
  const [deleteModal, setDeleteModal] = useState<{ userId: string; userName: string; userType: UserType } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const handleFreezeAccount = async (userId: string, userType: UserType) => {
    const reason = prompt("Enter reason for freezing this account:");
    if (!reason) return;

    const confirmed = confirm(
      `Are you sure you want to FREEZE this account?\n\nUser will not be able to login or use the platform.\n\nReason: ${reason}`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userType, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to freeze account");
      }

      alert("Account frozen successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error freezing account:", error);
      alert(error instanceof Error ? error.message : "Failed to freeze account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfreezeAccount = async (userId: string, userType: UserType) => {
    const confirmed = confirm(
      "Are you sure you want to UNFREEZE this account?\n\nUser will be able to login and use the platform again."
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users/unfreeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unfreeze account");
      }

      alert("Account unfrozen successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error unfreezing account:", error);
      alert(error instanceof Error ? error.message : "Failed to unfreeze account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (userId: string, userType: UserType, userName: string) => {
    setDeleteModal({ userId, userName, userType });
  };

  const confirmDeleteAccount = async (userId: string, userType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      setToast({
        message: "Account deleted successfully! Directory has been updated.",
        type: "success",
      });

      // Reload the page to refresh the user list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error deleting account:", error);
      setToast({
        message: error instanceof Error ? error.message : "Failed to delete account",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const renderGuideCard = (guide: Guide) => {
    const isExpanded = expandedUser === guide.profile_id;
    const profile = guide.profiles;

    return (
      <div key={guide.profile_id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Guide"}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                    {profile.full_name?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{profile.full_name}</h3>
                  <p className="text-sm text-foreground/70">{guide.headline || "No headline"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(profile.application_status)}`}>
                  {profile.application_status}
                </span>
                {!profile.verified && !profile.license_verified && (
                  <span className="px-2 py-1 text-xs rounded bg-amber-50 text-amber-700 border border-amber-300">
                    ⚠ Profile Not Claimed
                  </span>
                )}
                {profile.verified && (
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 border border-blue-300">
                    ✓ Verified
                  </span>
                )}
                {profile.license_verified && (
                  <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800 border border-purple-300">
                    ✓ License
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-foreground/60">Country:</span>
              <span className="ml-2 font-medium">{profile.country_code || "N/A"}</span>
            </div>
            <div>
              <span className="text-foreground/60">License #:</span>
              <span className="ml-2 font-medium">{guide.license_number || "N/A"}</span>
            </div>
            <div>
              <span className="text-foreground/60">Experience:</span>
              <span className="ml-2 font-medium">{guide.years_experience || 0} years</span>
            </div>
            <div>
              <span className="text-foreground/60">Profile ID:</span>
              <span className="ml-2 font-medium text-xs">{guide.profile_id.slice(0, 8)}...</span>
            </div>
          </div>

          <button
            onClick={() => setExpandedUser(isExpanded ? null : guide.profile_id)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            {isExpanded ? "Show Less ▲" : "Show More Details ▼"}
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-4 text-sm">
              <div>
                <strong className="text-foreground/80">Created:</strong>
                <span className="ml-2">{format(parseISO(guide.created_at), "PPP")}</span>
              </div>
              {profile.application_submitted_at && (
                <div>
                  <strong className="text-foreground/80">Applied:</strong>
                  <span className="ml-2">{format(parseISO(profile.application_submitted_at), "PPP")}</span>
                </div>
              )}
              {profile.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <strong className="text-red-800">Rejection Reason:</strong>
                  <p className="text-red-700 mt-1">{profile.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <button
              onClick={() => window.location.href = `/${locale}/admin/users/${guide.profile_id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleFreezeAccount(guide.profile_id, "guides")}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              ❄️ Freeze
            </button>
            <button
              onClick={() => handleDeleteAccount(guide.profile_id, "guides", profile.full_name || "Unknown")}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              🗑️ Delete
            </button>
            <button
              onClick={() => window.open(`/${locale}/guides/${guide.profile_id}`, "_blank")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              👁️ View Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAgencyCard = (agency: Agency) => {
    const isExpanded = expandedUser === agency.id;

    return (
      <div key={agency.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {agency.logo_url && (
                  <img
                    src={agency.logo_url}
                    alt={agency.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{agency.name}</h3>
                  <p className="text-sm text-foreground/70 capitalize">{agency.type}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(agency.application_status)}`}>
                  {agency.application_status}
                </span>
                {!agency.verified && (
                  <span className="px-2 py-1 text-xs rounded bg-amber-50 text-amber-700 border border-amber-300">
                    ⚠ Profile Not Claimed
                  </span>
                )}
                {agency.verified && (
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 border border-blue-300">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-foreground/60">Email:</span>
              <span className="ml-2 font-medium">{agency.contact_email}</span>
            </div>
            <div>
              <span className="text-foreground/60">Phone:</span>
              <span className="ml-2 font-medium">{agency.contact_phone || "N/A"}</span>
            </div>
            <div>
              <span className="text-foreground/60">Country:</span>
              <span className="ml-2 font-medium">{agency.registration_country || "N/A"}</span>
            </div>
            <div>
              <span className="text-foreground/60">Website:</span>
              {agency.website_url ? (
                <a href={agency.website_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                  Link
                </a>
              ) : (
                <span className="ml-2 font-medium">N/A</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpandedUser(isExpanded ? null : agency.id)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            {isExpanded ? "Show Less ▲" : "Show More Details ▼"}
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-4 text-sm">
              {/* Registration & Legal */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-base mb-3">📋 Registration & Legal</h4>
                <div className="space-y-2">
                  <div>
                    <strong className="text-foreground/80">Registration Number:</strong>
                    <span className="ml-2">{agency.registration_number || "N/A"}</span>
                  </div>
                  <div>
                    <strong className="text-foreground/80">VAT ID:</strong>
                    <span className="ml-2">{agency.vat_id || "N/A"}</span>
                  </div>
                  <div>
                    <strong className="text-foreground/80">Country Code:</strong>
                    <span className="ml-2">{agency.country_code || "N/A"}</span>
                  </div>
                  <div>
                    <strong className="text-foreground/80">Slug:</strong>
                    <span className="ml-2">{agency.slug || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-base mb-3">🏢 Business Information</h4>
                <div className="space-y-2">
                  <div>
                    <strong className="text-foreground/80">Description:</strong>
                    <p className="text-foreground/70 mt-1">{agency.description || "No description provided"}</p>
                  </div>
                  {agency.coverage_summary && (
                    <div>
                      <strong className="text-foreground/80">Coverage Summary:</strong>
                      <p className="text-foreground/70 mt-1">{agency.coverage_summary}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Services & Capabilities */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold text-base mb-3">⚙️ Services & Capabilities</h4>
                <div className="space-y-3">
                  <div>
                    <strong className="text-foreground/80">Services Offered:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(agency.services_offered || agency.service_types || []).length > 0 ? (
                        (agency.services_offered || agency.service_types || []).map((service: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-green-200 text-green-900 rounded text-xs">
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No services listed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages & Certifications */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-bold text-base mb-3">🌐 Languages & Certifications</h4>
                <div className="space-y-3">
                  <div>
                    <strong className="text-foreground/80">Languages Supported:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {agency.languages_supported?.length > 0 ? (
                        agency.languages_supported.map((lang, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-200 text-purple-900 rounded text-xs">
                            {lang}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No languages listed</span>
                      )}
                    </div>
                  </div>
                  {agency.certifications && agency.certifications.length > 0 && (
                    <div>
                      <strong className="text-foreground/80">Certifications:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agency.certifications.map((cert, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-200 text-purple-900 rounded text-xs">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability & Location */}
              {(agency.timezone || agency.availability_timezone || agency.availability_notes || agency.location_data) && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-bold text-base mb-3">📍 Availability & Location</h4>
                  <div className="space-y-2">
                    {agency.timezone && (
                      <div>
                        <strong className="text-foreground/80">Timezone:</strong>
                        <span className="ml-2">{agency.timezone}</span>
                      </div>
                    )}
                    {agency.availability_timezone && (
                      <div>
                        <strong className="text-foreground/80">Availability Timezone:</strong>
                        <span className="ml-2">{agency.availability_timezone}</span>
                      </div>
                    )}
                    {agency.availability_notes && (
                      <div>
                        <strong className="text-foreground/80">Availability Notes:</strong>
                        <p className="text-foreground/70 mt-1">{agency.availability_notes}</p>
                      </div>
                    )}
                    {agency.working_hours && (
                      <div>
                        <strong className="text-foreground/80">Working Hours:</strong>
                        <pre className="text-xs mt-1 bg-white p-2 rounded overflow-auto">{JSON.stringify(agency.working_hours, null, 2)}</pre>
                      </div>
                    )}
                    {agency.location_data?.headquarters_address && (
                      <div>
                        <strong className="text-foreground/80">Headquarters Address:</strong>
                        <p className="text-foreground/70 mt-1">{agency.location_data.headquarters_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fleet Data (for transport) */}
              {agency.type === "transport" && agency.fleet_data && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-bold text-base mb-3">🚗 Fleet Information</h4>
                  <pre className="text-xs mt-1 bg-white p-2 rounded overflow-auto">{JSON.stringify(agency.fleet_data, null, 2)}</pre>
                </div>
              )}

              {/* Import & Application Data */}
              {agency.application_data && Object.keys(agency.application_data).length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-bold text-base mb-3">📄 Import & Application Data</h4>
                  <div className="space-y-2">
                    {agency.application_data.english_name && (
                      <div>
                        <strong className="text-foreground/80">English Name:</strong>
                        <span className="ml-2">{agency.application_data.english_name}</span>
                      </div>
                    )}
                    {agency.application_data.license_issue_date && (
                      <div>
                        <strong className="text-foreground/80">License Issue Date:</strong>
                        <span className="ml-2">{agency.application_data.license_issue_date}</span>
                      </div>
                    )}
                    {agency.application_data.fax && (
                      <div>
                        <strong className="text-foreground/80">Fax:</strong>
                        <span className="ml-2">{agency.application_data.fax}</span>
                      </div>
                    )}
                    {agency.application_data.import_source && (
                      <div>
                        <strong className="text-foreground/80">Import Source:</strong>
                        <span className="ml-2 text-xs text-gray-500">{agency.application_data.import_source}</span>
                      </div>
                    )}
                    {agency.application_data.imported_at && (
                      <div>
                        <strong className="text-foreground/80">Imported:</strong>
                        <span className="ml-2 text-xs text-gray-500">{new Date(agency.application_data.imported_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-base mb-3">📅 Important Dates</h4>
                <div className="space-y-2">
                  <div>
                    <strong className="text-foreground/80">Created:</strong>
                    <span className="ml-2">{format(parseISO(agency.created_at), "PPP")}</span>
                  </div>
                  {agency.application_submitted_at && (
                    <div>
                      <strong className="text-foreground/80">Applied:</strong>
                      <span className="ml-2">{format(parseISO(agency.application_submitted_at), "PPP")}</span>
                    </div>
                  )}
                  {agency.application_reviewed_at && (
                    <div>
                      <strong className="text-foreground/80">Reviewed:</strong>
                      <span className="ml-2">{format(parseISO(agency.application_reviewed_at), "PPP")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              {agency.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <strong className="text-red-800">Rejection Reason:</strong>
                  <p className="text-red-700 mt-1">{agency.rejection_reason}</p>
                </div>
              )}
            </div>
          )}


          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <button
              onClick={() => window.location.href = `/${locale}/admin/users/${agency.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleFreezeAccount(agency.id, selectedTab)}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              ❄️ Freeze
            </button>
            <button
              onClick={() => handleDeleteAccount(agency.id, selectedTab, agency.name)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              🗑️ Delete
            </button>
            <button
              onClick={() => window.open(`/${locale}/${agency.type === "agency" ? "agencies" : agency.type === "dmc" ? "dmcs" : "transport"}/${agency.slug}`, "_blank")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              👁️ View Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentUsers = users[selectedTab];

  // Filter users
  const filteredUsers = currentUsers.filter((user: any) => {
    const matchesSearch = selectedTab === "guides"
      ? (user.profiles.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.license_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.profile_id?.toLowerCase().includes(searchQuery.toLowerCase()))
      : (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.registration_number?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" ||
      (selectedTab === "guides"
        ? user.profiles.application_status === statusFilter
        : user.application_status === statusFilter);

    const matchesVerified = verifiedFilter === "all" ||
      (verifiedFilter === "verified" && (selectedTab === "guides" ? user.profiles.verified : user.verified)) ||
      (verifiedFilter === "unverified" && !(selectedTab === "guides" ? user.profiles.verified : user.verified));

    const isFrozen = selectedTab === "guides"
      ? user.profiles.rejection_reason?.startsWith("FROZEN:")
      : user.rejection_reason?.startsWith("FROZEN:");

    const matchesActive = activeFilter === "all" ||
      (activeFilter === "frozen" && isFrozen) ||
      (activeFilter === "active" && !isFrozen);

    return matchesSearch && matchesStatus && matchesVerified && matchesActive;
  });

  const stats = {
    total: currentUsers.length,
    pending: currentUsers.filter((u: any) =>
      selectedTab === "guides" ? u.profiles.application_status === "pending" : u.application_status === "pending"
    ).length,
    approved: currentUsers.filter((u: any) =>
      selectedTab === "guides" ? u.profiles.application_status === "approved" : u.application_status === "approved"
    ).length,
    rejected: currentUsers.filter((u: any) =>
      selectedTab === "guides" ? u.profiles.application_status === "rejected" : u.application_status === "rejected"
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-foreground/10">
        <div className="flex gap-1">
          {(["guides", "agencies", "dmcs", "transport"] as UserType[]).map((tab) => {
            const count = users[tab].length;
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 capitalize transition-colors
                  ${
                    selectedTab === tab
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-foreground/70 hover:text-foreground hover:bg-gray-50"
                  }
                `}
              >
                {tab}
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
          <div className="text-sm text-blue-700">Total</div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          <div className="text-sm text-yellow-700">Pending</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-800">{stats.approved}</div>
          <div className="text-sm text-green-700">Approved</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
          <div className="text-sm text-red-700">Rejected</div>
        </div>
      </div>

      {/* Enhanced Search & Filters */}
      <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🔍 Search & Filter Accounts</h3>
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              {selectedTab === "guides"
                ? "Search by name, license number, or profile ID"
                : "Search by name, email, or registration number"}
            </label>
            <input
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Account Status
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="all">All</option>
                <option value="active">Active Only</option>
                <option value="frozen">Frozen Only</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Verification Status
              </label>
              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="all">All</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Application Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
          {(searchQuery || statusFilter !== "all" || verifiedFilter !== "all" || activeFilter !== "all") && (
            <div className="flex items-center justify-between bg-white p-3 rounded">
              <span className="text-sm text-foreground/70">
                Showing {filteredUsers.length} of {currentUsers.length} {selectedTab}
              </span>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setVerifiedFilter("all");
                  setActiveFilter("all");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {!searchQuery && statusFilter === "all" && verifiedFilter === "all" && activeFilter === "all" ? (
          <div className="rounded-xl border border-foreground/10 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto max-w-md space-y-3">
              <svg
                className="mx-auto h-16 w-16 text-foreground/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">
                Use Filters to Search
              </h3>
              <p className="text-sm text-foreground/70">
                Please use the search box or filters above to find specific {selectedTab}.
                This helps manage the {currentUsers.length.toLocaleString()} total {selectedTab} more efficiently.
              </p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-foreground/50">
            No {selectedTab} found matching your filters.
          </div>
        ) : (
          filteredUsers.map((user: any) =>
            selectedTab === "guides"
              ? renderGuideCard(user)
              : renderAgencyCard(user)
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteUserModal
          userId={deleteModal.userId}
          userName={deleteModal.userName}
          userType={deleteModal.userType}
          onClose={() => setDeleteModal(null)}
          onConfirm={confirmDeleteAccount}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
