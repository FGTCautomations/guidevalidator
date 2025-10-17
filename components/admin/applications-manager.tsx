"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { approveApplicationAction, declineApplicationAction } from "@/app/_actions/applications";
import type { SupportedLocale } from "@/i18n/config";

type ApplicationStatus = "pending" | "approved" | "declined";

interface BaseApplication {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

interface GuideApplication extends BaseApplication {
  full_name: string;
  contact_email: string;
  contact_phone: string | null;
  license_number: string | null;
  specializations: string[];
  languages_spoken: any;
}

interface AgencyApplication extends BaseApplication {
  legal_company_name: string;
  contact_email: string;
  contact_phone: string | null;
  registration_number: string | null;
  services_offered: string[];
}

interface DmcApplication extends BaseApplication {
  legal_entity_name: string;
  contact_email: string;
  contact_phone: string | null;
  registration_number: string | null;
  services_offered: string[];
}

interface TransportApplication extends BaseApplication {
  legal_entity_name: string;
  contact_email: string;
  contact_phone: string | null;
  registration_number: string | null;
  service_types: string[];
}

interface ApplicationsManagerProps {
  locale: SupportedLocale;
  applications: {
    guide: GuideApplication[];
    agency: AgencyApplication[];
    dmc: DmcApplication[];
    transport: TransportApplication[];
  };
}

type ApplicationType = "guide" | "agency" | "dmc" | "transport";

export function ApplicationsManager({ locale, applications }: ApplicationsManagerProps) {
  const [selectedTab, setSelectedTab] = useState<ApplicationType>("guide");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  const handleApprove = async (appId: string, type: ApplicationType) => {
    if (!confirm("Are you sure you want to approve this application? This will create a user account and send approval email.")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await approveApplicationAction(appId, type);

      if (!result.ok) {
        throw new Error(result.error || "Failed to approve application");
      }

      alert("Application approved! User account created and approval email sent.");
      window.location.reload();
    } catch (error) {
      console.error("Error approving application:", error);
      alert(error instanceof Error ? error.message : "Failed to approve application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async (appId: string, type: ApplicationType) => {
    const reason = prompt("Enter reason for decline (optional):");
    if (reason === null) return; // User cancelled

    setIsLoading(true);
    try {
      const result = await declineApplicationAction(appId, type, reason || undefined);

      if (!result.ok) {
        throw new Error(result.error || "Failed to decline application");
      }

      alert("Application declined. Notification email sent to applicant.");
      window.location.reload();
    } catch (error) {
      console.error("Error declining application:", error);
      alert(error instanceof Error ? error.message : "Failed to decline application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderApplicationCard = (app: any, type: ApplicationType) => {
    const isExpanded = expandedApp === app.id;
    const name =
      type === "guide" ? app.full_name :
      type === "agency" ? app.legal_company_name :
      app.legal_entity_name;

    return (
      <div key={app.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">{name}</h3>
              <p className="text-sm text-foreground/70">{app.contact_email}</p>
              {app.contact_phone && (
                <p className="text-sm text-foreground/70">{app.contact_phone}</p>
              )}
            </div>
            <span className={`px-3 py-1 text-xs rounded-full capitalize ${getStatusColor(app.status)}`}>
              {app.status}
            </span>
          </div>

          <div className="text-xs text-foreground/60 mb-3">
            Applied: {format(parseISO(app.created_at), "PPp")}
          </div>

          <button
            onClick={() => setExpandedApp(isExpanded ? null : app.id)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              {type === "guide" && (
                <>
                  <div><strong>License Number:</strong> {app.license_number || "Not provided"}</div>
                  <div><strong>Specializations:</strong> {app.specializations.join(", ") || "None"}</div>
                  <div><strong>Languages:</strong> {JSON.stringify(app.languages_spoken)}</div>
                </>
              )}
              {(type === "agency" || type === "dmc" || type === "transport") && (
                <>
                  <div><strong>Registration Number:</strong> {app.registration_number || "Not provided"}</div>
                  <div><strong>Services/Types:</strong> {
                    (app.services_offered || app.service_types || []).join(", ") || "None"
                  }</div>
                </>
              )}
            </div>
          )}

          {app.status === "pending" && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleApprove(app.id, type)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading}
              >
                Approve
              </button>
              <button
                onClick={() => handleDecline(app.id, type)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const currentApps = applications[selectedTab];
  const pendingCount = currentApps.filter(app => app.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-foreground/10">
        <div className="flex gap-1">
          {(["guide", "agency", "dmc", "transport"] as ApplicationType[]).map(tab => {
            const count = applications[tab].filter(app => app.status === "pending").length;
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 capitalize transition-colors
                  ${selectedTab === tab
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-foreground/70 hover:text-foreground hover:bg-gray-50"
                  }
                `}
              >
                {tab} Applications
                {count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-400 text-yellow-900 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-800">{pendingCount}</div>
          <div className="text-sm text-yellow-700">Pending</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-800">
            {currentApps.filter(app => app.status === "approved").length}
          </div>
          <div className="text-sm text-green-700">Approved</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-800">
            {currentApps.filter(app => app.status === "declined").length}
          </div>
          <div className="text-sm text-red-700">Declined</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {currentApps.length === 0 ? (
          <div className="text-center py-12 text-foreground/50">
            No {selectedTab} applications found.
          </div>
        ) : (
          currentApps.map(app => renderApplicationCard(app, selectedTab))
        )}
      </div>
    </div>
  );
}