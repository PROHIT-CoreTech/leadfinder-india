import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayInstance, getRazorpayPlanId } from "@/lib/razorpay";
import { PAID_PLANS, type PaidPlan } from "@/lib/types";

/**
 * POST /api/billing/create-subscription
 * body: { plan: "starter" | "pro" | "agency" }
 *
 * Creates a Razorpay Subscription for the signed-in user and returns
 * the subscription id + Razorpay key id, which the client uses to
 * open Razorpay Checkout. The subscription starts in "created" status
 * on Razorpay's side — it only becomes "active" once the customer
 * completes payment in Checkout, which is what /verify confirms.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { plan } = (await request.json()) as { plan?: PaidPlan };

  if (!plan || !PAID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  try {
    const razorpay = getRazorpayInstance();
    const planId = getRazorpayPlanId(plan);

    // total_count is required by Razorpay even for "ongoing" monthly
    // billing — 120 cycles (10 years) effectively means indefinite,
    // renewing automatically each month until cancelled.
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120,
      notes: {
        supabase_user_id: user.id,
        plan,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout." },
      { status: 500 }
    );
  }
}
