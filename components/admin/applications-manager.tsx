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
  application_status?: ApplicationStatus;
  application_submitted_at?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
}

interface AgencyApplication extends BaseApplication {
  legal_company_name: string;
  contact_email: string;
  contact_phone: string | null;
  registration_number: string | null;
  services_offered: string[];
  application_data?: any; // Full application form data
  name?: string;
  website_url?: string;
  registration_country?: string;
  vat_id?: string;
  country_code?: string;
  certifications?: string[];
  languages_supported?: string[];
  application_status?: ApplicationStatus;
  application_submitted_at?: string;
  description?: string;
  slug?: string;
  timezone?: string;
  availability_timezone?: string;
  working_hours?: any;
  availability_notes?: string;
  location_data?: any;
  coverage_summary?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
}

interface DmcApplication extends BaseApplication {
  legal_entity_name: string;
  contact_email: string;
  contact_phone: string | null;
  registration_number: string | null;
  services_offered: string[];
  application_data?: any;
  application_status?: ApplicationStatus;
  application_submitted_at?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
}

interface TransportApplication extends BaseApplication {
  legal_entity_name: string;
  contact_email: string;
  contact_phone: string | null;
  registration_number: string | null;
  service_types: string[];
  application_data?: any;
  application_status?: ApplicationStatus;
  application_submitted_at?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
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

  const formatTimezone = (tz: string) => {
    if (!tz) return "Not provided";
    // Convert timezone like "Australia/Darwin" to "Australia - Darwin (UTC+9:30)"
    const parts = tz.split('/');
    if (parts.length === 2) {
      return `${parts[0]} - ${parts[1].replace(/_/g, ' ')}`;
    }
    return tz;
  };

  const renderWorkingHours = (hours: any) => {
    if (!hours) return <span className="text-gray-500">Not provided</span>;

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const enabledDays = daysOrder.filter(day => hours[day]?.enabled);

    if (enabledDays.length === 0) {
      return <span className="text-gray-500">No working hours set</span>;
    }

    return (
      <div className="space-y-1 mt-2">
        {enabledDays.map(day => (
          <div key={day} className="flex items-center gap-2 text-xs bg-white p-2 rounded">
            <span className="font-semibold capitalize w-24">{day}:</span>
            <span className="text-green-700">
              {hours[day].startTime} - {hours[day].endTime}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderFieldWithValidation = (label: string, value: any, isRequired: boolean = false) => {
    const isEmpty = !value || (Array.isArray(value) && value.length === 0);
    const showWarning = isRequired && isEmpty;

    return (
      <div className="flex items-start gap-2 py-2 border-b border-gray-200 last:border-0">
        {showWarning && <span className="text-red-500 font-bold text-lg" title="Required field missing">⚠</span>}
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-700 mb-1">{label}</div>
          <div className={`text-sm ${showWarning ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
            {isEmpty ? <span className="text-gray-400 italic">Not provided</span> : (typeof value === 'string' ? value : JSON.stringify(value))}
          </div>
        </div>
      </div>
    );
  };

  const renderApplicationCard = (app: any, type: ApplicationType) => {
    const isExpanded = expandedApp === app.id;
    const appStatus = app.application_status || app.status;
    const isPending = appStatus === "pending";
    const name =
      type === "guide" ? app.full_name :
      type === "agency" ? (app.name || app.legal_company_name) :
      app.legal_entity_name;

    // Check payment status
    const hasPayment = app.stripe_customer_id || app.subscription_status === 'active';
    const paymentStatus = hasPayment ? "Paid" : "Not Paid Yet";

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
            <div className="flex flex-col gap-2 items-end">
              <span className={`px-3 py-1 text-xs rounded-full capitalize ${getStatusColor(appStatus)}`}>
                {appStatus}
              </span>
              <span className={`px-3 py-1 text-xs rounded-full ${hasPayment ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {paymentStatus}
              </span>
            </div>
          </div>

          <div className="text-xs text-foreground/60 mb-3">
            Applied: {format(parseISO(app.application_submitted_at || app.created_at), "PPp")}
          </div>

          <button
            onClick={() => setExpandedApp(isExpanded ? null : app.id)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            {isExpanded ? "Show Less ▲" : "Show All Details ▼"}
          </button>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-4 text-sm">
              {type === "agency" && (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl shadow-sm border-2 border-blue-200">
                    <h4 className="font-bold text-lg mb-4 text-blue-900 flex items-center gap-2">
                      <span className="text-2xl">🏢</span> Business Information
                    </h4>
                    <div className="bg-white p-4 rounded-lg">
                      {renderFieldWithValidation("Legal Company Name", app.name || app.legal_company_name, true)}
                      {renderFieldWithValidation("Website URL", app.website_url, false)}
                      {renderFieldWithValidation("Business Description", app.description || (app.application_data?.description), false)}
                      {renderFieldWithValidation("Profile Slug", app.slug, false)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl shadow-sm border-2 border-gray-300">
                    <h4 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                      <span className="text-2xl">📋</span> Registration & Legal
                    </h4>
                    <div className="bg-white p-4 rounded-lg">
                      {renderFieldWithValidation("Registration Country", app.registration_country, true)}
                      {renderFieldWithValidation("Registration Number", app.registration_number, true)}
                      {renderFieldWithValidation("VAT ID", app.vat_id, false)}
                      {renderFieldWithValidation("Country Code", app.country_code, true)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-5 rounded-xl shadow-sm border-2 border-indigo-200">
                    <h4 className="font-bold text-lg mb-4 text-indigo-900 flex items-center gap-2">
                      <span className="text-2xl">📞</span> Contact Information
                    </h4>
                    <div className="bg-white p-4 rounded-lg">
                      {renderFieldWithValidation("Contact Email", app.contact_email, true)}
                      {renderFieldWithValidation("Contact Phone", app.contact_phone, true)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl shadow-sm border-2 border-green-200">
                    <h4 className="font-bold text-lg mb-4 text-green-900 flex items-center gap-2">
                      <span className="text-2xl">⚙️</span> Services & Capabilities
                    </h4>
                    <div className="bg-white p-4 rounded-lg space-y-3">
                      <div className="py-3 border-b border-gray-200">
                        <div className="flex items-start gap-2">
                          {(!app.services_offered || app.services_offered.length === 0) && (
                            <span className="text-red-500 font-bold text-lg" title="Required field missing">⚠</span>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-700 mb-2">Services Offered</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {app.services_offered && app.services_offered.length > 0 ? (
                                app.services_offered.map((service: string, idx: number) => (
                                  <span key={idx} className="px-3 py-2 bg-green-200 text-green-900 rounded-lg text-sm font-medium shadow-sm">
                                    {service}
                                  </span>
                                ))
                              ) : (
                                <span className="text-red-600 italic">Not provided</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {renderFieldWithValidation("Coverage Summary", app.coverage_summary, false)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-xl shadow-sm border-2 border-purple-200">
                    <h4 className="font-bold text-lg mb-4 text-purple-900 flex items-center gap-2">
                      <span className="text-2xl">🌐</span> Languages & Certifications
                    </h4>
                    <div className="bg-white p-4 rounded-lg space-y-3">
                      <div className="py-3 border-b border-gray-200">
                        <div className="flex items-start gap-2">
                          {(!app.languages_supported || app.languages_supported.length === 0) && (
                            <span className="text-red-500 font-bold text-lg" title="Required field missing">⚠</span>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-700 mb-2">Languages Supported</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {app.languages_supported && app.languages_supported.length > 0 ? (
                                app.languages_supported.map((lang: string, idx: number) => (
                                  <span key={idx} className="px-3 py-2 bg-purple-200 text-purple-900 rounded-lg text-sm font-medium shadow-sm">
                                    {lang}
                                  </span>
                                ))
                              ) : (
                                <span className="text-red-600 italic">Not provided</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="py-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-700 mb-2">Certifications</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {app.certifications && app.certifications.length > 0 ? (
                                app.certifications.map((cert: string, idx: number) => (
                                  <span key={idx} className="px-3 py-2 bg-yellow-200 text-yellow-900 rounded-lg text-sm font-medium shadow-sm">
                                    {cert}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500 italic">None provided</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-5 rounded-xl shadow-sm border-2 border-teal-200">
                    <h4 className="font-bold text-lg mb-4 text-teal-900 flex items-center gap-2">
                      <span className="text-2xl">🕐</span> Location & Availability
                    </h4>
                    <div className="bg-white p-4 rounded-lg space-y-3">
                      <div className="py-2 border-b border-gray-200">
                        <div className="font-semibold text-sm text-gray-700 mb-1">Timezone</div>
                        <div className="text-sm text-gray-900">{formatTimezone(app.timezone || app.availability_timezone)}</div>
                      </div>
                      <div className="py-2 border-b border-gray-200">
                        <div className="font-semibold text-sm text-gray-700 mb-1">Working Hours</div>
                        {renderWorkingHours(app.working_hours)}
                      </div>
                      {renderFieldWithValidation("Availability Notes", app.availability_notes, false)}
                    </div>
                  </div>

                  {app.application_data && (
                    <div className="bg-orange-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-semibold text-base mb-3 text-orange-900">Additional Data from Application Form</h4>
                      {Object.entries(app.application_data).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>
                          <span className="ml-2">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {type === "guide" && (
                <>
                  {renderFieldWithValidation("License Number", app.license_number, true)}
                  {renderFieldWithValidation("Specializations", app.specializations?.join(", "), false)}
                  {renderFieldWithValidation("Languages", JSON.stringify(app.languages_spoken), false)}
                </>
              )}
              {(type === "dmc" || type === "transport") && (
                <>
                  {renderFieldWithValidation("Registration Number", app.registration_number, true)}
                  {renderFieldWithValidation("Services/Types", (app.services_offered || app.service_types || []).join(", "), true)}
                </>
              )}
            </div>
          )}

          {isPending && (
            <div className="flex gap-3 mt-4 pt-4 border-t">
              <button
                onClick={() => handleApprove(app.id, type)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
                disabled={isLoading}
              >
                ✓ Approve Application
              </button>
              <button
                onClick={() => handleDecline(app.id, type)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-semibold"
                disabled={isLoading}
              >
                ✗ Decline Application
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const currentApps = applications[selectedTab];
  const pendingCount = currentApps.filter(app => (app.application_status || app.status) === "pending").length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-foreground/10">
        <div className="flex gap-1">
          {(["guide", "agency", "dmc", "transport"] as ApplicationType[]).map(tab => {
            const count = applications[tab].filter(app => (app.application_status || app.status) === "pending").length;
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
            {currentApps.filter(app => (app.application_status || app.status) === "approved").length}
          </div>
          <div className="text-sm text-green-700">Approved</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-800">
            {currentApps.filter(app => (app.application_status || app.status) === "declined").length}
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