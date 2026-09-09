import Link from "next/link";
import { Lock } from "lucide-react";
import type { Plan } from "@/lib/types";

const NEXT_PLAN_PITCH: Record<Plan, string> = {
  free: "Upgrade to Starter for 100 leads a month.",
  starter: "Upgrade to Pro for 500 leads a month and full call CRM access.",
  pro: "Upgrade to Agency for unlimited leads and team seats.",
  agency: "You're on the top plan — nothing to upgrade to.",
};

/**
 * Shared "you've hit your plan's limit" empty state — used both for the
 * free tier's per-search cap and a paid plan's monthly cap running out.
 */
export function LimitReachedState({
  plan,
  headline,
}: {
  plan: Plan;
  headline: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-accent bg-accent-soft px-4 py-8 text-center">
      <Lock className="mx-auto mb-3 text-accent" size={20} strokeWidth={1.75} />
      <p className="text-sm font-medium text-ink">{headline}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
        {NEXT_PLAN_PITCH[plan]}
      </p>
      {plan !== "agency" && (
        <Link
          href="/dashboard/billing"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          View plans
        </Link>
      )}
    </div>
  );
}
