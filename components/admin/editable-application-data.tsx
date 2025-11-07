"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROFILE_LANGUAGE_CODES, GUIDE_SPECIALTY_OPTIONS, ORGANIZATION_SPECIALTY_OPTIONS } from "@/lib/constants/profile";
import { getLanguageName } from "@/lib/utils/locale";

interface EditableApplicationDataProps {
  userId: string;
  userRole: string;
  applicationData: any;
  guideData: any;
  agencyData: any;
}

// Define dropdown options for specific fields
const GENDER_OPTIONS = ["male", "female", "other", "prefer-not-to-say"];
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "JPY", "CNY", "AUD", "CAD", "CHF", "INR", "AED"];
const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
];

export function EditableApplicationData({
  userId,
  userRole,
  applicationData,
  guideData,
  agencyData,
}: EditableApplicationDataProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const router = useRouter();

  // Merge all data sources
  const allData = {
    ...applicationData,
    ...guideData,
    ...agencyData,
  };

  // Filter out system fields
  const filteredEntries = Object.entries(allData).filter(
    ([key]) =>
      !["id", "profile_id", "organization_id", "created_at", "updated_at", "application_data"].includes(key) &&
      !key.startsWith("_")
  );

  const formatKey = (key: string): string => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getFieldType = (key: string, value: any): string => {
    // Check if it's a specific dropdown field
    if (key === "gender") return "gender";
    if (key === "currency") return "currency";
    if (key === "timezone") return "timezone";
    if (key === "specialties") return "specialties";
    if (key === "spoken_languages") return "languages";

    // Check for known array fields by key name
    const arrayFieldNames = ["languages", "certifications", "services", "regions", "cities"];
    if (arrayFieldNames.some(name => key.toLowerCase().includes(name))) return "array";

    // Check general types
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object" && value !== null) return "json";
    return "text";
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Normalize value to prevent controlled/uncontrolled component warnings
  const normalizeValue = (value: any, fieldType: string): any => {
    if (value === null || value === undefined) {
      if (fieldType === "number") return 0;
      if (fieldType === "boolean") return false;
      if (fieldType === "array" || fieldType === "specialties" || fieldType === "languages") return [];
      if (fieldType === "json") return {};
      return ""; // Default to empty string for text inputs
    }
    return value;
  };

  const handleEdit = () => {
    setEditedData({ ...allData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData({});
    setIsEditing(false);
  };

  const handleFieldChange = (key: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Filter out system fields that shouldn't be updated
      const dataToSave = Object.fromEntries(
        Object.entries(editedData).filter(
          ([key]) =>
            !["id", "profile_id", "organization_id", "created_at", "updated_at"].includes(key) &&
            !key.startsWith("_")
        )
      );

      const response = await fetch("/api/admin/users/update-application-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userRole,
          data: dataToSave,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update application data");
      }

      alert("Application data updated successfully!");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving application data:", error);
      alert(error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditableField = (key: string, value: any) => {
    const fieldType = getFieldType(key, value);
    const rawValue = editedData[key] !== undefined ? editedData[key] : value;
    const currentValue = normalizeValue(rawValue, fieldType);
    const baseInputClass = "w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none";

    switch (fieldType) {
      case "gender":
        return (
          <select
            value={currentValue || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </option>
            ))}
          </select>
        );

      case "currency":
        return (
          <select
            value={currentValue || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select currency</option>
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "timezone":
        return (
          <select
            value={currentValue || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select timezone</option>
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "specialties":
        const specialtyOptions = userRole === "guide" ? GUIDE_SPECIALTY_OPTIONS : ORGANIZATION_SPECIALTY_OPTIONS;
        const currentSpecialties = Array.isArray(currentValue) ? currentValue : [];

        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {specialtyOptions.map((specialty) => {
                const normalizedSpecialty = specialty.toLowerCase().replace(/\s+/g, "-");
                const isSelected = currentSpecialties.some(
                  (s: string) => s.toLowerCase().replace(/\s+/g, "-") === normalizedSpecialty
                );

                return (
                  <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        let newSpecialties;
                        if (e.target.checked) {
                          newSpecialties = [...currentSpecialties, normalizedSpecialty];
                        } else {
                          newSpecialties = currentSpecialties.filter(
                            (s: string) => s.toLowerCase().replace(/\s+/g, "-") !== normalizedSpecialty
                          );
                        }
                        handleFieldChange(key, newSpecialties);
                      }}
                      className="rounded border-foreground/20 text-foreground focus:ring-foreground"
                    />
                    <span className="text-sm text-foreground">{specialty}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case "languages":
        const currentLanguages = Array.isArray(currentValue) ? currentValue : [];

        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {PROFILE_LANGUAGE_CODES.map((langCode) => {
                const isSelected = currentLanguages.includes(langCode);
                const langName = getLanguageName("en", langCode) || langCode.toUpperCase();

                return (
                  <label key={langCode} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        let newLanguages;
                        if (e.target.checked) {
                          newLanguages = [...currentLanguages, langCode];
                        } else {
                          newLanguages = currentLanguages.filter((l: string) => l !== langCode);
                        }
                        handleFieldChange(key, newLanguages);
                      }}
                      className="rounded border-foreground/20 text-foreground focus:ring-foreground"
                    />
                    <span className="text-sm text-foreground">{langName}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case "boolean":
        return (
          <select
            value={currentValue ? "true" : "false"}
            onChange={(e) => handleFieldChange(key, e.target.value === "true")}
            className={baseInputClass}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case "number":
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
            className={baseInputClass}
          />
        );

      case "array":
        return (
          <input
            type="text"
            value={Array.isArray(currentValue) ? currentValue.join(", ") : ""}
            onChange={(e) =>
              handleFieldChange(
                key,
                e.target.value.split(",").map((v) => v.trim()).filter(Boolean)
              )
            }
            placeholder="Separate values with commas"
            className={baseInputClass}
          />
        );

      case "json":
        return (
          <textarea
            value={typeof currentValue === "object" ? JSON.stringify(currentValue, null, 2) : currentValue}
            onChange={(e) => {
              try {
                handleFieldChange(key, JSON.parse(e.target.value));
              } catch {
                handleFieldChange(key, e.target.value);
              }
            }}
            rows={4}
            className={`${baseInputClass} font-mono resize-none`}
          />
        );

      default:
        // Check if it's a URL field
        const isUrl = key.toLowerCase().includes("url") || (typeof currentValue === "string" && currentValue.startsWith("http"));

        if (isUrl && typeof currentValue === "string" && currentValue.startsWith("http")) {
          return (
            <div className="space-y-2">
              <input
                type="text"
                value={String(currentValue)}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className={baseInputClass}
              />
              <a
                href={currentValue}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                View file
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          );
        }

        // Long text field
        if (typeof currentValue === "string" && currentValue.length > 100) {
          return (
            <textarea
              value={String(currentValue)}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              rows={3}
              className={`${baseInputClass} resize-none`}
            />
          );
        }

        return (
          <input
            type="text"
            value={String(currentValue)}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className={baseInputClass}
          />
        );
    }
  };

  if (filteredEntries.length === 0) {
    return (
      <div className="rounded-xl border border-foreground/10 bg-white p-6">
        <p className="text-sm text-foreground/60 text-center">No application data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-foreground/10 bg-white p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Application Data</h3>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-foreground text-background rounded-[var(--radius-lg)] hover:bg-foreground/90 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-foreground/20 text-foreground rounded-[var(--radius-lg)] hover:bg-foreground/5 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-foreground text-background rounded-[var(--radius-lg)] hover:bg-foreground/90 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {filteredEntries.map(([key, value]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {formatKey(key)}
            </label>
            {isEditing ? (
              renderEditableField(key, value)
            ) : (
              <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                {/* Check if it's a URL and render as link */}
                {key.toLowerCase().includes("url") && typeof value === "string" && value.startsWith("http") ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    View file
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <div className="p-3 bg-foreground/5 rounded-[var(--radius-lg)] border border-foreground/10">
                    {renderValue(value) || <span className="text-foreground/40 italic">Empty</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
