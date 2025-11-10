"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { SupportedLocale } from "@/i18n/config";

type ApplicationStatus = "pending" | "approved" | "rejected";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
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
  description: string | null;
  website_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  services_offered: string[];
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
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");

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
    const confirmed1 = confirm(
      `⚠️ WARNING: You are about to PERMANENTLY DELETE this account!\n\nUser: ${userName}\n\nThis action CANNOT be undone. All user data will be deleted.\n\nAre you absolutely sure?`
    );
    if (!confirmed1) return;

    const confirmed2 = prompt(
      `Type "DELETE ${userName}" to confirm permanent deletion:`
    );
    if (confirmed2 !== `DELETE ${userName}`) {
      alert("Deletion cancelled - confirmation text did not match.");
      return;
    }

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

      alert("Account deleted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(error instanceof Error ? error.message : "Failed to delete account");
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
                {profile.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Guide"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
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
              <span className="text-foreground/60">Email:</span>
              <span className="ml-2 font-medium">{profile.email || "N/A"}</span>
            </div>
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
          </div>

          <button
            onClick={() => setExpandedUser(isExpanded ? null : guide.profile_id)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            {isExpanded ? "Show Less ▲" : "Show More Details ▼"}
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3 text-sm">
              <div>
                <strong className="text-foreground/80">Specialties:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {guide.specialties?.map((spec, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <strong className="text-foreground/80">Languages:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {guide.spoken_languages?.map((lang, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <strong className="text-foreground/80">Bio:</strong>
                <p className="text-foreground/70 mt-1">{guide.bio || guide.professional_intro || "No bio provided"}</p>
              </div>
              {guide.hourly_rate_cents && (
                <div>
                  <strong className="text-foreground/80">Hourly Rate:</strong>
                  <span className="ml-2">{(guide.hourly_rate_cents / 100).toFixed(2)} {guide.currency || "USD"}</span>
                </div>
              )}
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
            <div className="mt-4 pt-4 border-t space-y-3 text-sm">
              <div>
                <strong className="text-foreground/80">Description:</strong>
                <p className="text-foreground/70 mt-1">{agency.description || "No description provided"}</p>
              </div>
              <div>
                <strong className="text-foreground/80">Services:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agency.services_offered?.map((service, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <strong className="text-foreground/80">Languages:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agency.languages_supported?.map((lang, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              {agency.certifications && agency.certifications.length > 0 && (
                <div>
                  <strong className="text-foreground/80">Certifications:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agency.certifications.map((cert, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
              {agency.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <strong className="text-red-800">Rejection Reason:</strong>
                  <p className="text-red-700 mt-1">{agency.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

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
         user.profiles.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.license_number?.toLowerCase().includes(searchQuery.toLowerCase()))
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

    return matchesSearch && matchesStatus && matchesVerified;
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
              Search by name, email, license, or registration number
            </label>
            <input
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>
          <div className="flex gap-4">
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
                <option value="rejected">Rejected</option>
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
          </div>
          {(searchQuery || statusFilter !== "all" || verifiedFilter !== "all") && (
            <div className="flex items-center justify-between bg-white p-3 rounded">
              <span className="text-sm text-foreground/70">
                Showing {filteredUsers.length} of {currentUsers.length} {selectedTab}
              </span>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setVerifiedFilter("all");
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
        {filteredUsers.length === 0 ? (
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
    </div>
  );
}
