"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type AntiScrapingSettingsFormProps = {
  currentSettings: {
    id?: string;
    max_reveals_per_day?: number;
    max_reveals_free: number;
    max_reveals_pro: number;
    max_reveals_dmc: number;
  };
  locale: string;
};

export function AntiScrapingSettingsForm({
  currentSettings,
  locale,
}: AntiScrapingSettingsFormProps) {
  const [maxRevealsFree, setMaxRevealsFree] = useState(currentSettings.max_reveals_free || 10);
  const [maxRevealsPro, setMaxRevealsPro] = useState(currentSettings.max_reveals_pro || 50);
  const [maxRevealsDmc, setMaxRevealsDmc] = useState(currentSettings.max_reveals_dmc || 50);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the current settings ID
      const { data: settings } = await supabase
        .from("contact_reveal_settings")
        .select("id")
        .limit(1)
        .single();

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from("contact_reveal_settings")
          .update({
            max_reveals_free: maxRevealsFree,
            max_reveals_pro: maxRevealsPro,
            max_reveals_dmc: maxRevealsDmc,
            max_reveals_per_day: maxRevealsFree, // Keep for backwards compatibility
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase.from("contact_reveal_settings").insert({
          max_reveals_free: maxRevealsFree,
          max_reveals_pro: maxRevealsPro,
          max_reveals_dmc: maxRevealsDmc,
          max_reveals_per_day: maxRevealsFree,
          updated_by: user.id,
        });

        if (error) throw error;
      }

      setMessage({
        type: "success",
        text: "Settings updated successfully",
      });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMaxRevealsFree(10);
    setMaxRevealsPro(50);
    setMaxRevealsDmc(50);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Free Tier */}
      <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
        <label
          htmlFor="maxRevealsFree"
          className="block text-sm font-medium text-foreground mb-2"
        >
          <span className="flex items-center gap-2">
            Free Tier Rate Limit
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-normal text-gray-700">
              Default
            </span>
          </span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            id="maxRevealsFree"
            min="1"
            max="1000"
            value={maxRevealsFree}
            onChange={(e) => setMaxRevealsFree(parseInt(e.target.value) || 10)}
            className="w-32 rounded-lg border border-foreground/20 px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-sm text-foreground/60">reveals per user per 24 hours</span>
        </div>
        <p className="mt-2 text-sm text-foreground/60">
          For users without an active subscription or on free plans.
        </p>
      </div>

      {/* Pro Tier */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <label
          htmlFor="maxRevealsPro"
          className="block text-sm font-medium text-foreground mb-2"
        >
          <span className="flex items-center gap-2">
            Pro Subscription Rate Limit
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-normal text-primary">
              Premium
            </span>
          </span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            id="maxRevealsPro"
            min="1"
            max="1000"
            value={maxRevealsPro}
            onChange={(e) => setMaxRevealsPro(parseInt(e.target.value) || 50)}
            className="w-32 rounded-lg border border-foreground/20 px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-sm text-foreground/60">reveals per user per 24 hours</span>
        </div>
        <p className="mt-2 text-sm text-foreground/60">
          For users with: Guide Premium, Agency Pro, or Transport Growth subscriptions.
        </p>
      </div>

      {/* DMC Tier */}
      <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
        <label
          htmlFor="maxRevealsDmc"
          className="block text-sm font-medium text-foreground mb-2"
        >
          <span className="flex items-center gap-2">
            DMC Multi-Market Rate Limit
            <span className="rounded-full bg-purple-200 px-2 py-0.5 text-xs font-normal text-purple-800">
              Enterprise
            </span>
          </span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            id="maxRevealsDmc"
            min="1"
            max="1000"
            value={maxRevealsDmc}
            onChange={(e) => setMaxRevealsDmc(parseInt(e.target.value) || 50)}
            className="w-32 rounded-lg border border-foreground/20 px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-sm text-foreground/60">reveals per user per 24 hours</span>
        </div>
        <p className="mt-2 text-sm text-foreground/60">
          For users with: DMC Multi-Market or DMC Enterprise subscriptions.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Recommended Settings</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            <strong>Free Tier (5-10 reveals/day):</strong> Encourages upgrades while allowing basic usage
          </li>
          <li>
            <strong>Pro Tier (30-50 reveals/day):</strong> Suitable for professional users and agencies
          </li>
          <li>
            <strong>DMC Tier (50-100 reveals/day):</strong> High volume for enterprise DMCs
          </li>
        </ul>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-primary px-6 py-2 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-foreground/20 px-6 py-2 font-medium text-foreground transition hover:bg-foreground/5"
        >
          Reset to Defaults (10/50/50)
        </button>
      </div>
    </form>
  );
}
