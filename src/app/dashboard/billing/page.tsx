"use client";

import { useState } from "react";
import Script from "next/script";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import {
  PLAN_DETAILS,
  PLAN_LABELS,
  type PaidPlan,
} from "@/lib/types";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  theme?: { color: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

export default function BillingPage() {
  const { profile, setProfile } = useProfile();
  const router = useRouter();

  const [upgrading, setUpgrading] = useState<PaidPlan | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleUpgrade(plan: PaidPlan) {
    setError(null);
    setNotice(null);
    setUpgrading(plan);

    try {
      const response = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not start checkout.");
      }

      if (typeof window.Razorpay === "undefined") {
        throw new Error(
          "Payment widget hasn't finished loading yet — try again in a moment."
        );
      }

      const razorpay = new window.Razorpay({
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "LeadFinder India",
        description: `${PLAN_LABELS[plan]} plan — monthly subscription`,
        theme: { color: "#4f46e5" },
        handler: async (response) => {
          await verifyPayment(plan, response);
        },
        modal: {
          ondismiss: () => setUpgrading(null),
        },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setUpgrading(null);
    }
  }

  async function verifyPayment(
    plan: PaidPlan,
    response: {
      razorpay_payment_id: string;
      razorpay_subscription_id: string;
      razorpay_signature: string;
    }
  ) {
    try {
      const verifyResponse = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...response, plan }),
      });
      const result = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(result.error ?? "Payment verification failed.");
      }

      setProfile({
        ...profile,
        plan,
        subscription_status: "active",
        next_billing_at: result.nextBillingAt ?? profile.next_billing_at,
      });
      setNotice(`You're now on the ${PLAN_LABELS[plan]} plan.`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment succeeded but we couldn't confirm it — contact support."
      );
    } finally {
      setUpgrading(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel your subscription and move to the Free plan?")) return;

    setCancelling(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not cancel subscription.");
      }

      setProfile({
        ...profile,
        plan: "free",
        subscription_status: "cancelled",
        next_billing_at: null,
      });
      setNotice("Subscription cancelled — you're back on the Free plan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCancelling(false);
    }
  }

  const isPaidActive =
    profile.plan !== "free" && profile.subscription_status === "active";

  return (
    <div className="p-4 sm:p-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Billing</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Manage your plan and subscription.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-panel-border bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-faint">Current plan</p>
            <p className="text-lg font-semibold text-ink">
              {PLAN_LABELS[profile.plan]}
            </p>
            {isPaidActive && profile.next_billing_at && (
              <p className="mt-0.5 text-xs text-ink-soft">
                Next billing date: {formatDate(profile.next_billing_at)}
              </p>
            )}
            {profile.subscription_status === "cancelled" && (
              <p className="mt-0.5 text-xs text-ink-faint">
                Subscription cancelled
              </p>
            )}
          </div>
          {isPaidActive && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-md border border-panel-border px-3 py-1.5 text-sm text-ink hover:bg-surface disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Cancel subscription"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-soft px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 rounded-md bg-green-soft px-3 py-2 text-sm text-green">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_DETAILS.map((planDetail) => {
          const isCurrent = profile.plan === planDetail.key;
          const isPaid = planDetail.key !== "free";

          return (
            <div
              key={planDetail.key}
              className={`flex flex-col rounded-lg border bg-panel p-5 ${
                isCurrent ? "border-accent ring-1 ring-accent" : "border-panel-border"
              }`}
            >
              <p className="text-sm font-medium text-ink-soft">{planDetail.label}</p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {planDetail.priceDisplay}
                <span className="text-sm font-normal text-ink-faint">
                  {planDetail.priceSuffix}
                </span>
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {planDetail.features.map((feature) => (
                  <li
                    key={feature.text}
                    className="flex items-start gap-2 text-sm text-ink-soft"
                  >
                    <Check size={14} className="mt-0.5 shrink-0 text-green" strokeWidth={2} />
                    {feature.text}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <span className="block rounded-md bg-surface px-3 py-2 text-center text-sm font-medium text-ink-soft">
                    Current plan
                  </span>
                ) : isPaid ? (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(planDetail.key as PaidPlan)}
                    disabled={upgrading !== null}
                    className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                  >
                    {upgrading === planDetail.key
                      ? "Opening checkout…"
                      : `Upgrade to ${planDetail.label}`}
                  </button>
                ) : (
                  <span className="block rounded-md border border-panel-border px-3 py-2 text-center text-sm text-ink-faint">
                    Downgrade by cancelling above
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
