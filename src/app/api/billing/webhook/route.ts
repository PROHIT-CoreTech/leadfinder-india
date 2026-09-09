import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAID_PLANS, type PaidPlan } from "@/lib/types";

interface RazorpaySubscriptionEntity {
  id: string;
  current_end?: number;
  notes?: { supabase_user_id?: string; plan?: string };
}

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscriptionEntity };
  };
}

/**
 * POST /api/billing/webhook
 *
 * Razorpay calls this directly (no browser session involved), so it
 * authenticates via the webhook signature instead of a cookie, and
 * writes through the admin client. Configure this URL — your-domain/
 * api/billing/webhook — under Razorpay Dashboard → Settings → Webhooks,
 * subscribed to at least: subscription.activated, subscription.charged,
 * subscription.cancelled, subscription.completed, subscription.halted.
 *
 * This is the source of truth for plan status — the /verify route
 * only gives an instant unlock right after checkout; this route keeps
 * things correct for renewals, failed payments, and cancellations
 * that happen outside that one moment.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  // Signature is computed over the exact raw body, so read text
  // before any JSON parsing.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!signature || signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const subscription = body.payload.subscription?.entity;

  if (!subscription) {
    // Not a subscription-related event we care about — acknowledge and skip.
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const userId = subscription.notes?.supabase_user_id;
  const notedPlan = subscription.notes?.plan as PaidPlan | undefined;

  // Prefer matching by the stored user id from notes; fall back to
  // matching by subscription id for events on subscriptions this
  // instance didn't create the notes for.
  const matchColumn = userId ? "id" : "razorpay_subscription_id";
  const matchValue = userId ?? subscription.id;

  switch (body.event) {
    case "subscription.activated":
    case "subscription.charged": {
      const plan = notedPlan && PAID_PLANS.includes(notedPlan) ? notedPlan : undefined;
      await admin
        .from("profiles")
        .update({
          ...(plan ? { plan } : {}),
          razorpay_subscription_id: subscription.id,
          subscription_status: "active",
          next_billing_at: subscription.current_end
            ? new Date(subscription.current_end * 1000).toISOString()
            : null,
        })
        .eq(matchColumn, matchValue);
      break;
    }

    case "subscription.cancelled":
    case "subscription.completed":
    case "subscription.halted": {
      await admin
        .from("profiles")
        .update({
          plan: "free",
          subscription_status: "cancelled",
          next_billing_at: null,
        })
        .eq(matchColumn, matchValue);
      break;
    }

    default:
      // Other events (e.g. subscription.pending) aren't acted on yet.
      break;
  }

  return NextResponse.json({ received: true });
}
