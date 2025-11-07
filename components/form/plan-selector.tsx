"use client";

import { useEffect } from "react";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  stripeUrl?: string;
  setupFee?: string;
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
      id: "guide-premium-monthly",
      name: "Premium Profile (Monthly)",
      price: "EUR 9.99 / month",
      description: "Priority placement, unlimited introductions and access to detailed review analytics.",
      stripeUrl: "https://buy.stripe.com/dRmfZa7DT8rlakifs18so0e",
    },
    {
      id: "guide-premium-annual",
      name: "Premium Profile (Annual)",
      price: "EUR 90 / year",
      description: "Save 25% with annual billing. Priority placement, unlimited introductions and detailed analytics.",
      stripeUrl: "https://buy.stripe.com/dRm6oAgapcHB0JI7Zz8so0d",
    },
    {
      id: "guide-verification",
      name: "Verification Renewal",
      price: "EUR 40 / year",
      description: "Renew your badge annually and meet regional compliance requirements in minutes.",
      stripeUrl: "https://buy.stripe.com/eVqcMY1fv5f90JI1Bb8so07",
    },
  ],
  agency: [
    {
      id: "agency-basic-monthly",
      name: "Basic Subscription (Monthly)",
      price: "EUR 99 / month",
      setupFee: "EUR 250",
      description: "Full marketplace access, direct messaging and shortlist management for small teams.",
      stripeUrl: "https://buy.stripe.com/aFabIU8HX371fEC3Jj8so02",
    },
    {
      id: "agency-basic-annual",
      name: "Basic Subscription (Annual)",
      price: "EUR 890 / year",
      setupFee: "EUR 250",
      description: "Save 25% with annual billing. Full marketplace access and shortlist management.",
      stripeUrl: "https://buy.stripe.com/5kQ5kwcYd371fEC5Rr8so0g",
    },
    {
      id: "agency-pro-monthly",
      name: "Pro Subscription (Monthly)",
      price: "EUR 199 / month",
      setupFee: "EUR 250",
      description: "Advanced filters, featured placement and additional seats for growing operations.",
      stripeUrl: "https://buy.stripe.com/8x24gse2hcHBbomgw58so03",
    },
    {
      id: "agency-pro-annual",
      name: "Pro Subscription (Annual)",
      price: "EUR 1,790 / year",
      setupFee: "EUR 250",
      description: "Save 25% with annual billing. Advanced filters, featured placement and additional seats.",
      stripeUrl: "https://buy.stripe.com/aFa4gs8HXazt4ZY7Zz8so0f",
    },
  ],
  dmc: [
    {
      id: "dmc-regional-monthly",
      name: "Regional Subscription (Monthly)",
      price: "EUR 199 / month",
      setupFee: "EUR 250",
      description: "Access curated guide pools, transport partners and compliance dashboards for one region.",
      stripeUrl: "https://buy.stripe.com/14AcMY6zP6jdcsqa7H8so01",
    },
    {
      id: "dmc-regional-annual",
      name: "Regional Subscription (Annual)",
      price: "EUR 1,790 / year",
      setupFee: "EUR 250",
      description: "Save 25% with annual billing. Access curated guide pools and compliance dashboards.",
      stripeUrl: "https://buy.stripe.com/aFa8wIcYd5f9csq4Nn8so09",
    },
    {
      id: "dmc-multimarket-monthly",
      name: "Multi-Market Subscription (Monthly)",
      price: "EUR 299 / month",
      setupFee: "EUR 250",
      description: "Multi-country coverage, advanced branding, private folders and quarterly supply reviews.",
      stripeUrl: "https://buy.stripe.com/eVq14g8HXfTNbomdjT8so08",
    },
    {
      id: "dmc-multimarket-annual",
      name: "Multi-Market Subscription (Annual)",
      price: "EUR 2,690 / year",
      setupFee: "EUR 250",
      description: "Save 25% with annual billing. Multi-country coverage and advanced branding.",
      stripeUrl: "https://buy.stripe.com/00w14ggapazt3VUdjT8so0a",
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
      id: "transport-fleet-monthly",
      name: "Fleet Subscription (Monthly)",
      price: "EUR 49 / month",
      setupFee: "EUR 250",
      description: "Searchable company profile with service routes, compliance docs and messaging.",
      stripeUrl: "https://buy.stripe.com/3cI6oAbU99vpgIG1Bb8so04",
    },
    {
      id: "transport-fleet-annual",
      name: "Fleet Subscription (Annual)",
      price: "EUR 440 / year",
      setupFee: "EUR 250",
      description: "Save 25% with annual billing. Searchable company profile with service routes.",
      stripeUrl: "https://buy.stripe.com/7sYfZaf6ldLF0JI5Rr8so0b",
    },
    {
      id: "transport-growth-monthly",
      name: "Growth Pack (Monthly)",
      price: "EUR 79 / month",
      setupFee: "EUR 250",
      description: "Featured placement plus quarterly performance snapshots for your key destinations.",
      stripeUrl: "https://buy.stripe.com/aFa5kwcYd5f93VU3Jj8so05",
    },
    {
      id: "transport-growth-annual",
      name: "Growth Pack (Annual)",
      price: "EUR 710 / year",
      setupFee: "EUR 250",
      description: "Save 25% with annual billing. Featured placement and quarterly performance snapshots.",
      stripeUrl: "https://buy.stripe.com/4gM00c2jz9vp0JI4Nn8so0c",
    },
    {
      id: "transport-verification",
      name: "Verification Renewal",
      price: "EUR 40 / month",
      description: "Annual document review that displays a trusted badge across all vehicle listings.",
      stripeUrl: "https://buy.stripe.com/6oUdR24rHcHBfEC1Bb8so06",
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
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary block">{plan.price}</span>
                    {plan.setupFee && (
                      <span className="text-xs text-foreground/60">+ {plan.setupFee} setup</span>
                    )}
                  </div>
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

      {value && value !== "guide-free" && value !== "dmc-enterprise" && (() => {
        const selectedPlan = plans.find(p => p.id === value);
        if (selectedPlan?.stripeUrl) {
          return (
            <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-xl space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Next step: Complete payment</p>
                <p className="text-xs text-foreground/70">
                  After submitting this form, you'll need to complete your payment to activate your subscription.
                  {selectedPlan.setupFee && " A one-time setup fee applies."}
                </p>
              </div>
              <a
                href={selectedPlan.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                Complete Payment via Stripe →
              </a>
              <p className="text-xs text-foreground/60">
                You can also complete payment after submitting your application.
              </p>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
