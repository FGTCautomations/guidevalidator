"use client";

// AdsManager component - Complete CRUD interface for ads
// Features: Create, Edit, Delete, Toggle Active, Preview, Schedule, Target

import { useState, useEffect } from "react";
import type { Ad, CreateAdInput, AdType, AdPlacement } from "@/lib/ads/types";
import { AdPreview } from "./ad-preview";

export function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAdInput>>({
    ad_type: "banner",
    placement: [],
    is_active: true,
    weight: 1,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch("/api/admin/ads");
      if (response.ok) {
        const data = await response.json();
        setAds(data);
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAd(null);
    setFormData({
      ad_type: "banner",
      placement: [],
      is_active: true,
      weight: 1,
      list_context: "guides",
      start_at: new Date().toISOString().slice(0, 16),
      end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
    });
    setShowForm(true);
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      advertiser_name: ad.advertiser_name,
      ad_type: ad.ad_type,
      placement: ad.placement,
      target_url: ad.target_url || "",
      image_url: ad.image_url || "",
      headline: ad.headline || "",
      description: ad.description || "",
      cta_label: ad.cta_label || "",
      country_filter: ad.country_filter || [],
      keywords: ad.keywords || [],
      start_at: new Date(ad.start_at).toISOString().slice(0, 16),
      end_at: new Date(ad.end_at).toISOString().slice(0, 16),
      is_active: ad.is_active,
      weight: ad.weight,
      list_context: (ad as any).list_context || "guides",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAd
        ? `/api/admin/ads/${editingAd.id}`
        : "/api/admin/ads";
      const method = editingAd ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAds();
        setShowForm(false);
        setEditingAd(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving ad:", error);
      alert("Failed to save ad");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      const response = await fetch(`/api/admin/ads/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAds();
      } else {
        alert("Failed to delete ad");
      }
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Failed to delete ad");
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/ads/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await fetchAds();
      } else {
        alert("Failed to toggle ad status");
      }
    } catch (error) {
      console.error("Error toggling ad:", error);
      alert("Failed to toggle ad status");
    }
  };

  const handlePlacementChange = (placement: AdPlacement, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      placement: checked
        ? [...(prev.placement || []), placement]
        : (prev.placement || []).filter((p) => p !== placement),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    setUploading(true);
    setUploadProgress("Uploading image...");

    try {
      console.log("[Client] Creating FormData and appending file");
      const formData = new FormData();
      formData.append("file", file);
      console.log("[Client] File appended to FormData:", file.name, file.size, file.type);

      console.log("[Client] Starting fetch to /api/admin/ads/upload");
      const response = await fetch("/api/admin/ads/upload", {
        method: "POST",
        body: formData,
      });
      console.log("[Client] Fetch completed, response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, image_url: data.url }));
        setUploadProgress("Upload successful!");
        setTimeout(() => setUploadProgress(""), 3000);
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
        setUploadProgress("");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload image");
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading ads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create button */}
      {!showForm && (
        <button
          onClick={handleCreate}
          className="rounded-2xl bg-brand-primary px-6 py-3 font-medium text-white transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        >
          + Create New Ad
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-roboto text-xl font-bold">
              {editingAd ? "Edit Ad" : "Create New Ad"}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-foreground/50 hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Advertiser Name */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Advertiser Name *
            </label>
            <input
              type="text"
              required
              value={formData.advertiser_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, advertiser_name: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* Ad Type */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Ad Type *
            </label>
            <select
              required
              value={formData.ad_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ad_type: e.target.value as AdType,
                })
              }
              className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="banner">Banner</option>
              <option value="native_card">Native Card</option>
              <option value="partner_tile">Partner Tile</option>
            </select>
          </div>

          {/* Placements */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Placements * (select at least one)
            </label>
            <div className="mt-2 space-y-2">
              {(["homepage_mid", "listings", "sidebar", "footer"] as AdPlacement[]).map(
                (placement) => (
                  <label key={placement} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.placement?.includes(placement)}
                      onChange={(e) =>
                        handlePlacementChange(placement, e.target.checked)
                      }
                      className="rounded border-foreground/20 text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-sm capitalize">
                      {placement.replace("_", " ")}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* List Context - Which directory to show ad in */}
          {formData.placement?.includes("listings") && (
            <div>
              <label className="block text-sm font-medium text-foreground">
                Show in Directory * (for listings placement)
              </label>
              <select
                required
                value={(formData as any).list_context || "guides"}
                onChange={(e) =>
                  setFormData({ ...formData, list_context: e.target.value } as any)
                }
                className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="guides">Guides Directory</option>
                <option value="agencies">Agencies Directory</option>
                <option value="dmcs">DMCs Directory</option>
                <option value="transport">Transport Directory</option>
              </select>
              <p className="mt-1 text-xs text-foreground/60">
                Select which directory this ad should appear in when placement is "listings"
              </p>
            </div>
          )}

          {/* Image URL / Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Image {formData.ad_type !== "native_card" && "*"}
            </label>
            <div className="mt-1 space-y-2">
              <input
                type="url"
                required={formData.ad_type !== "native_card" && !formData.image_url}
                value={formData.image_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://example.com/ad-image.jpg or upload below"
                className="w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-foreground/20 bg-foreground/5 px-4 py-2 transition-colors hover:border-brand-primary hover:bg-brand-primary/5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-foreground/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-sm font-medium text-foreground">
                    {uploading ? "Uploading..." : "Upload Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {uploadProgress && (
                  <span className="text-sm text-green-600">{uploadProgress}</span>
                )}
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-xs text-foreground/70">
                <p className="font-semibold text-foreground mb-2">📐 Image Requirements:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>File formats:</strong> JPEG, PNG, WebP, or GIF</li>
                  <li><strong>Max file size:</strong> 5MB (recommended: under 150KB for fast loading)</li>
                  <li><strong>Aspect ratios & dimensions:</strong>
                    <ul className="ml-4 mt-1 space-y-0.5">
                      <li>• <strong>Banner ads:</strong> 728x90px (8:1 ratio) or 970x250px (3.88:1 ratio)</li>
                      <li>• <strong>Sidebar ads:</strong> 300x600px (1:2 ratio)</li>
                      <li>• <strong>Square/Native ads:</strong> 300x250px (6:5 ratio)</li>
                    </ul>
                  </li>
                  <li><strong>Best practices:</strong> Use high-quality images, compress before uploading, ensure text is readable</li>
                </ul>
              </div>
            </div>
            {formData.image_url && (
              <div className="mt-2 overflow-hidden rounded-xl border border-foreground/10">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="h-auto w-full max-w-md object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Headline {formData.ad_type === "native_card" && "*"}
            </label>
            <input
              type="text"
              required={formData.ad_type === "native_card"}
              value={formData.headline || ""}
              onChange={(e) =>
                setFormData({ ...formData, headline: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* Target URL */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Target URL
            </label>
            <input
              type="url"
              value={formData.target_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, target_url: e.target.value })
              }
              placeholder="https://example.com"
              className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* CTA Label */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              CTA Label
            </label>
            <input
              type="text"
              value={formData.cta_label || ""}
              onChange={(e) =>
                setFormData({ ...formData, cta_label: e.target.value })
              }
              placeholder="Learn more"
              className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_at || ""}
                onChange={(e) =>
                  setFormData({ ...formData, start_at: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                End Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_at || ""}
                onChange={(e) =>
                  setFormData({ ...formData, end_at: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Weight (rotation priority)
            </label>
            <input
              type="number"
              min="1"
              value={formData.weight || 1}
              onChange={(e) =>
                setFormData({ ...formData, weight: parseInt(e.target.value) })
              }
              className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            <p className="mt-1 text-xs text-foreground/50">
              Higher weight = more likely to be selected
            </p>
          </div>

          {/* Active Toggle */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-foreground/20 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm font-medium text-foreground">
                Active
              </span>
            </label>
          </div>

          {/* Country Filter (optional - simplified) */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Country Filter (optional, comma-separated ISO2 codes)
            </label>
            <input
              type="text"
              value={formData.country_filter?.join(",") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  country_filter: e.target.value
                    ? e.target.value.split(",").map((c) => c.trim())
                    : [],
                })
              }
              placeholder="US,GB,FR"
              className="mt-1 w-full rounded-xl border border-foreground/20 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            <p className="mt-1 text-xs text-foreground/50">
              Leave empty for global targeting
            </p>
          </div>

          {/* Preview */}
          {formData.advertiser_name && formData.ad_type && (
            <div className="rounded-xl bg-brand-bg p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Preview
              </h3>
              <AdPreview ad={formData as Ad} />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-brand-primary px-6 py-2 font-medium text-white transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
            >
              {editingAd ? "Update Ad" : "Create Ad"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-2xl border border-foreground/20 px-6 py-2 font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Ads List */}
      <div className="space-y-4">
        <h2 className="font-roboto text-xl font-bold">All Ads ({ads.length})</h2>
        {ads.length === 0 ? (
          <p className="text-foreground/50">No ads created yet</p>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {ad.advertiser_name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        ad.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ad.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {ad.ad_type}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70">{ad.headline}</p>
                  <p className="text-xs text-foreground/50">
                    {new Date(ad.start_at).toLocaleDateString()} -{" "}
                    {new Date(ad.end_at).toLocaleDateString()} | Weight:{" "}
                    {ad.weight} | Placements: {ad.placement.join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(ad.id, ad.is_active)}
                    className="rounded-xl border border-foreground/20 px-3 py-1 text-sm transition-colors hover:bg-foreground/5"
                  >
                    {ad.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleEdit(ad)}
                    className="rounded-xl bg-brand-primary/10 px-3 py-1 text-sm text-brand-primary transition-colors hover:bg-brand-primary/20"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="rounded-xl bg-red-50 px-3 py-1 text-sm text-red-600 transition-colors hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
