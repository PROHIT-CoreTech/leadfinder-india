"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Briefcase, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CITIES, BUSINESS_TYPE_LABELS, type BusinessType } from "@/lib/types";

const BUSINESS_TYPE_OPTIONS: {
  value: BusinessType;
  icon: typeof Building2;
  description: string;
}[] = [
  {
    value: "agency",
    icon: Building2,
    description: "I run a marketing/sales agency finding leads for clients",
  },
  {
    value: "freelancer",
    icon: Briefcase,
    description: "I work solo, prospecting for my own outreach",
  },
  {
    value: "business",
    icon: Store,
    description: "I'm sourcing leads for my own business",
  },
];

export function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();

  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [primaryCity, setPrimaryCity] = useState<string>(CITIES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessType) {
      setError("Pick the option that best describes you.");
      return;
    }

    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session expired — please sign in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        business_type: businessType,
        primary_city: primaryCity,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
            L
          </span>
          <span className="text-lg font-semibold text-ink">LeadFinder India</span>
        </div>
        <h1 className="text-lg font-semibold text-ink">
          Quick setup before your first search
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Takes 10 seconds — helps us pre-fill your searches.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-panel-border bg-panel p-6"
      >
        <p className="mb-3 text-sm font-medium text-ink">
          What best describes you?
        </p>
        <div className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {BUSINESS_TYPE_OPTIONS.map(({ value, icon: Icon, description }) => {
            const isSelected = businessType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setBusinessType(value)}
                className={`flex flex-col items-start gap-2 rounded-md border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-accent bg-accent-soft"
                    : "border-panel-border hover:bg-surface"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  className={isSelected ? "text-accent" : "text-ink-soft"}
                />
                <span className="text-sm font-medium text-ink">
                  {BUSINESS_TYPE_LABELS[value]}
                </span>
                <span className="text-xs text-ink-soft">{description}</span>
              </button>
            );
          })}
        </div>

        <label className="mb-1.5 block text-sm font-medium text-ink">
          Which city will you search first?
        </label>
        <select
          value={primaryCity}
          onChange={(e) => setPrimaryCity(e.target.value)}
          className="mb-6 w-full rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink focus:border-accent"
        >
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        {error && (
          <p className="mb-4 rounded-md bg-red-soft px-3 py-2 text-sm text-red">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-accent px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Setting up…" : "Continue to dashboard"}
        </button>
      </form>
    </div>
  );
}
