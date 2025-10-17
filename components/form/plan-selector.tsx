"use client";

import { useEffect } from "react";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
}

interface PlanSelectorProps {
  role: "guide" | "agency" | "dmc" | "transport";
  value: string;
  onChange: (planId: string) => void;
  label?: string;
  preselectedPlan?: string;
}

const PLANS_BY_ROLE: Record<string, Plan[]> = {
  guide: [
    {
      id: "guide-free",
      name: "Free Plan",
      price: "EUR 0",
      description: "Create your profile, appear in search with basic visibility and collect reviews once verified.",
    },
    {
      id: "guide-premium",
      name: "Premium Profile",
      price: "EUR 9.99 / month",
      description: "Priority placement, unlimited introductions and access to detailed review analytics.",
    },
    {
      id: "guide-verification",
      name: "Verification Renewal",
      price: "EUR 40 / year",
      description: "Renew your badge annually and meet regional compliance requirements in minutes.",
    },
  ],
  agency: [
    {
      id: "agency-basic",
      name: "Basic Subscription",
      price: "EUR 99 / month",
      description: "Full marketplace access, direct messaging and shortlist management for small teams.",
    },
    {
      id: "agency-pro",
      name: "Pro Subscription",
      price: "EUR 199 / month",
      description: "Advanced filters, featured placement and additional seats for growing operations.",
    },
  ],
  dmc: [
    {
      id: "dmc-core",
      name: "Regional DMC",
      price: "EUR 199 / month",
      description: "Access curated guide pools, transport partners and compliance dashboards for one region.",
    },
    {
      id: "dmc-multimarket",
      name: "Multi-market DMC",
      price: "EUR 299 / month",
      description: "Multi-country coverage, advanced branding, private folders and quarterly supply reviews.",
    },
    {
      id: "dmc-enterprise",
      name: "Enterprise Partnership",
      price: "Custom",
      description: "Dedicated success manager, API access and procurement-ready agreements.",
    },
  ],
  transport: [
    {
      id: "transport-subscription",
      name: "Fleet Subscription",
      price: "EUR 49 / month",
      description: "Searchable company profile with service routes, compliance docs and messaging.",
    },
    {
      id: "transport-verified",
      name: "Verified Badge Add-on",
      price: "EUR 40 / year",
      description: "Annual document review that displays a trusted badge across all vehicle listings.",
    },
    {
      id: "transport-growth",
      name: "Growth Pack",
      price: "EUR 79 / month",
      description: "Featured placement plus quarterly performance snapshots for your key destinations.",
    },
  ],
};

export function PlanSelector({ role, value, onChange, label = "Subscription Plan", preselectedPlan }: PlanSelectorProps) {
  const plans = PLANS_BY_ROLE[role] || [];

  // Set preselected plan if provided and not already set
  useEffect(() => {
    if (preselectedPlan && !value) {
      const planExists = plans.find(p => p.id === preselectedPlan);
      if (planExists) {
        onChange(preselectedPlan);
      }
    }
  }, [preselectedPlan, value, onChange, plans]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        {label} <span className="text-red-500">*</span>
      </label>

      <div className="space-y-3">
        {plans.map((plan) => (
          <label
            key={plan.id}
            className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
              value === plan.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="subscription-plan"
                value={plan.id}
                checked={value === plan.id}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-4 h-4 text-primary focus:ring-2 focus:ring-primary/20"
                required
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground">{plan.name}</span>
                  <span className="text-sm font-medium text-primary">{plan.price}</span>
                </div>
                <p className="text-sm text-foreground/70">{plan.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>

      {value === "dmc-enterprise" && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <strong>Enterprise Partnership:</strong> Our team will contact you within 24 hours to discuss your specific requirements and create a custom agreement.
        </div>
      )}
    </div>
  );
}
