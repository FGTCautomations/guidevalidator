"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GuideData = {
  id: string;
  full_name: string;
  email: string;
  country_code: string;
  profile_completed: boolean;
  profile_completion_percentage: number;
  application_data: any;
  created_at: string;
  guides: any;
  profile_claim_tokens: Array<{
    id: string;
    token: string;
    license_number: string;
    expires_at: string;
    claimed_at: string | null;
  }>;
};

type Props = {
  guides: GuideData[];
};

export function GuideInvitationManager({ guides }: Props) {
  const router = useRouter();
  const [selectedGuides, setSelectedGuides] = useState<Set<string>>(new Set());
  const [showClaimLinks, setShowClaimLinks] = useState(false);
  const [filter, setFilter] = useState<"all" | "unclaimed" | "claimed">("all");

  const filteredGuides = guides.filter((guide) => {
    const claimToken = guide.profile_claim_tokens[0];
    if (!claimToken) return filter === "all";

    if (filter === "unclaimed") {
      return !claimToken.claimed_at && new Date(claimToken.expires_at) > new Date();
    }
    if (filter === "claimed") {
      return !!claimToken.claimed_at;
    }
    return true;
  });

  const toggleGuide = (guideId: string) => {
    const newSelected = new Set(selectedGuides);
    if (newSelected.has(guideId)) {
      newSelected.delete(guideId);
    } else {
      newSelected.add(guideId);
    }
    setSelectedGuides(newSelected);
  };

  const toggleAll = () => {
    if (selectedGuides.size === filteredGuides.length) {
      setSelectedGuides(new Set());
    } else {
      setSelectedGuides(new Set(filteredGuides.map((g) => g.id)));
    }
  };

  const exportClaimLinks = () => {
    const selectedGuidesData = guides.filter((g) => selectedGuides.has(g.id));
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const csv = [
      ["Guide Name", "License Number", "Claim Link", "Languages", "Status", "Expires"].join(","),
      ...selectedGuidesData.map((guide) => {
        const claimToken = guide.profile_claim_tokens[0];
        const claimLink = claimToken
          ? `${baseUrl}/en/claim-profile/${claimToken.token}`
          : "No token";
        const languages =
          guide.guides?.spoken_languages?.join("; ") || "Not specified";
        const status = claimToken?.claimed_at
          ? "Claimed"
          : new Date(claimToken?.expires_at || "") < new Date()
          ? "Expired"
          : "Unclaimed";
        const expires = claimToken?.expires_at
          ? new Date(claimToken.expires_at).toLocaleDateString()
          : "N/A";

        return [
          `"${guide.full_name}"`,
          `"${claimToken?.license_number || ""}"`,
          `"${claimLink}"`,
          `"${languages}"`,
          status,
          expires,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guide-invitations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyClaimLinks = () => {
    const selectedGuidesData = guides.filter((g) => selectedGuides.has(g.id));
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const text = selectedGuidesData
      .map((guide) => {
        const claimToken = guide.profile_claim_tokens[0];
        const claimLink = claimToken
          ? `${baseUrl}/en/claim-profile/${claimToken.token}`
          : "No token";

        return `${guide.full_name} (${claimToken?.license_number || "No license"})\n${claimLink}\n`;
      })
      .join("\n");

    navigator.clipboard.writeText(text);
    alert("Claim links copied to clipboard!");
  };

  const stats = {
    total: guides.length,
    unclaimed: guides.filter(
      (g) =>
        g.profile_claim_tokens[0] &&
        !g.profile_claim_tokens[0].claimed_at &&
        new Date(g.profile_claim_tokens[0].expires_at) > new Date()
    ).length,
    claimed: guides.filter((g) => g.profile_claim_tokens[0]?.claimed_at).length,
    expired: guides.filter(
      (g) =>
        g.profile_claim_tokens[0] &&
        !g.profile_claim_tokens[0].claimed_at &&
        new Date(g.profile_claim_tokens[0].expires_at) <= new Date()
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60 mb-1">Total Imported</p>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60 mb-1">Unclaimed</p>
          <p className="text-3xl font-bold text-orange-600">{stats.unclaimed}</p>
        </div>
        <div className="bg-white rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60 mb-1">Claimed</p>
          <p className="text-3xl font-bold text-green-600">{stats.claimed}</p>
        </div>
        <div className="bg-white rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60 mb-1">Expired</p>
          <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            All ({guides.length})
          </button>
          <button
            onClick={() => setFilter("unclaimed")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === "unclaimed"
                ? "bg-primary text-white"
                : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            Unclaimed ({stats.unclaimed})
          </button>
          <button
            onClick={() => setFilter("claimed")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === "claimed"
                ? "bg-primary text-white"
                : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            Claimed ({stats.claimed})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportClaimLinks}
            disabled={selectedGuides.size === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV ({selectedGuides.size})
          </button>
          <button
            onClick={copyClaimLinks}
            disabled={selectedGuides.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Copy Links ({selectedGuides.size})
          </button>
        </div>
      </div>

      {/* Guide List */}
      <div className="bg-white rounded-lg border border-foreground/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-foreground/5 border-b border-foreground/10">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filteredGuides.length > 0 &&
                      selectedGuides.size === filteredGuides.length
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-foreground/20"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  License #
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  Languages
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  Completion
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGuides.map((guide) => {
                const claimToken = guide.profile_claim_tokens[0];
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                const claimLink = claimToken
                  ? `${baseUrl}/en/claim-profile/${claimToken.token}`
                  : null;
                const isClaimed = !!claimToken?.claimed_at;
                const isExpired =
                  claimToken &&
                  !isClaimed &&
                  new Date(claimToken.expires_at) <= new Date();
                const languages = guide.guides?.spoken_languages?.join(", ") || "Not specified";

                return (
                  <tr
                    key={guide.id}
                    className="border-b border-foreground/5 hover:bg-foreground/5"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedGuides.has(guide.id)}
                        onChange={() => toggleGuide(guide.id)}
                        className="w-4 h-4 rounded border-foreground/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {guide.full_name}
                        </p>
                        <p className="text-xs text-foreground/60">{guide.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono text-foreground">
                        {claimToken?.license_number || "N/A"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground/70">{languages}</p>
                    </td>
                    <td className="px-4 py-3">
                      {isClaimed ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Claimed
                        </span>
                      ) : isExpired ? (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                          Unclaimed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-foreground/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{
                              width: `${guide.profile_completion_percentage || 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground/70">
                          {guide.profile_completion_percentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {claimLink && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(claimLink);
                            alert("Claim link copied!");
                          }}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          Copy Link
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground/60">No guides found for the selected filter.</p>
          </div>
        )}
      </div>

      {/* Email Template */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Sample Invitation Email Template
        </h3>
        <div className="bg-white rounded-lg p-4 text-sm space-y-3 border border-blue-200">
          <p className="font-semibold">Subject: Claim Your Guide Profile on Guide Validator</p>
          <div className="space-y-2 text-foreground/80">
            <p>Dear [Guide Name],</p>
            <p>
              We've created a professional profile for you on Guide Validator, a platform that
              connects licensed tour guides with travel agencies and DMCs.
            </p>
            <p>
              <strong>Your License Number:</strong> [License Number]
            </p>
            <p>
              <strong>Claim Your Profile:</strong> [Claim Link]
            </p>
            <p>
              This link will expire in 90 days. Once you claim your profile, you can:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Complete your professional profile</li>
              <li>Get discovered by travel agencies and DMCs</li>
              <li>Receive booking requests directly</li>
              <li>Manage your availability calendar</li>
            </ul>
            <p>Best regards,<br />Guide Validator Team</p>
          </div>
        </div>
      </div>
    </div>
  );
}
