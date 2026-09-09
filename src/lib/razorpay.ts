import Razorpay from "razorpay";
import type { PaidPlan } from "@/lib/types";

/**
 * SERVER-ONLY. Never import this file from a Client Component —
 * it reads RAZORPAY_KEY_SECRET, which must never reach the browser.
 */
export function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local."
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Each paid plan's Razorpay Plan ID lives in its own env var, created
// once via the Razorpay Dashboard (Subscriptions → Plans). We only
// ever store the ID here, never plan pricing — pricing is configured
// on the Razorpay side so it can't drift from what a customer is
// actually charged.
const PLAN_ENV_VARS: Record<PaidPlan, string> = {
  starter: "RAZORPAY_PLAN_STARTER",
  pro: "RAZORPAY_PLAN_PRO",
  agency: "RAZORPAY_PLAN_AGENCY",
};

export function getRazorpayPlanId(plan: PaidPlan): string {
  const envVar = PLAN_ENV_VARS[plan];
  const planId = process.env[envVar];
  if (!planId) {
    throw new Error(
      `${envVar} is not set — create this plan in the Razorpay Dashboard and add its Plan ID to .env.local.`
    );
  }
  return planId;
}
