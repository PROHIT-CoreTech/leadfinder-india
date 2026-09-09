import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayInstance } from "@/lib/razorpay";

/**
 * POST /api/billing/cancel
 *
 * Cancels the signed-in user's Razorpay subscription immediately and
 * downgrades them to the free plan right away. (A softer option would
 * be `cancel_at_cycle_end: true` to let them keep access until the
 * period they already paid for ends — worth considering later, kept
 * simple as immediate cancellation for now.)
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("razorpay_subscription_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (profile.razorpay_subscription_id) {
    try {
      const razorpay = getRazorpayInstance();
      await razorpay.subscriptions.cancel(profile.razorpay_subscription_id, false);
    } catch (err) {
      // If Razorpay already considers it cancelled (e.g. a webhook beat
      // us to it), don't block the user from seeing themselves as free.
      console.error("Razorpay cancel error:", err);
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "free",
      subscription_status: "cancelled",
      next_billing_at: null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
