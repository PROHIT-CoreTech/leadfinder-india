import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayInstance } from "@/lib/razorpay";
import { PAID_PLANS, type PaidPlan } from "@/lib/types";

interface VerifyBody {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  plan: PaidPlan;
}

/**
 * POST /api/billing/verify
 *
 * Called from the client right after Razorpay Checkout's `handler`
 * callback fires. Verifies the payment signature server-side before
 * trusting anything the browser sent, then unlocks the plan.
 *
 * This is a convenience path for "unlock immediately after payment."
 * The webhook route is still the source of truth for renewals and
 * cancellations that happen outside this flow.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json()) as VerifyBody;
  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
    plan,
  } = body;

  if (
    !razorpay_payment_id ||
    !razorpay_subscription_id ||
    !razorpay_signature ||
    !plan ||
    !PAID_PLANS.includes(plan)
  ) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured." },
      { status: 500 }
    );
  }

  // Signature = HMAC-SHA256(payment_id + "|" + subscription_id, key_secret).
  // This is what proves the payment really came from Razorpay and
  // wasn't just a client claiming success.
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment signature mismatch." }, { status: 400 });
  }

  // Fetch the subscription for its real current_end date rather than
  // guessing "today + 1 month" — Razorpay is the source of truth.
  let nextBillingAt: string | null = null;
  try {
    const razorpay = getRazorpayInstance();
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    if (subscription.current_end) {
      nextBillingAt = new Date(subscription.current_end * 1000).toISOString();
    }
  } catch {
    // Non-fatal — plan still unlocks even if we can't fetch the exact date.
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      plan,
      razorpay_subscription_id,
      subscription_status: "active",
      next_billing_at: nextBillingAt,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, plan, nextBillingAt });
}
