import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLeadsFromGooglePlaces } from "@/lib/google-places";
import {
  CACHE_MAX_AGE_DAYS,
  PAGE_SIZE,
  CITIES,
  CATEGORIES,
  FREE_PLAN_LEADS_PER_SEARCH,
  MONTHLY_LEAD_LIMITS,
  type Plan,
} from "@/lib/types";

interface SearchRequestBody {
  city: string;
  category: string;
  page?: number;
}

/**
 * POST /api/leads/search
 *
 * This is the single entry point for the search dashboard. It:
 *   1. Confirms the caller is signed in.
 *   2. Checks how old the cached rows are for this city+category.
 *   3. Refreshes from the live Google Places API ONLY when the cache
 *      is missing or older than CACHE_MAX_AGE_DAYS — every other
 *      search is served entirely from our own `leads` table.
 *   4. Returns a paginated page of leads plus the freshness date the
 *      UI shows as "Data last refreshed: [date]".
 */
export async function POST(request: Request) {
  // 1. Auth check — done with the regular (cookie-aware) server client.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Writes (delete + insert on refresh, plus usage tracking) go
  // through the admin client because normal users only have SELECT
  // access to `leads` via RLS, and we want one consistent client for
  // both the profile checks below and the leads pipeline.
  const admin = createAdminClient();

  // 1b. Plan-based limits — free tier is capped per search, paid
  // plans have a rolling monthly cap that resets on `usage_reset_at`.
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("plan, leads_used_this_month, usage_reset_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Could not load your plan." }, { status: 500 });
  }

  const plan = profile.plan as Plan;
  let leadsUsedThisMonth = profile.leads_used_this_month;

  // Reset the monthly counter if we've rolled past the reset date.
  const today = new Date().toISOString().slice(0, 10);
  if (profile.usage_reset_at <= today) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1, 1);
    leadsUsedThisMonth = 0;
    await admin
      .from("profiles")
      .update({
        leads_used_this_month: 0,
        usage_reset_at: nextReset.toISOString().slice(0, 10),
      })
      .eq("id", user.id);
  }

  const effectivePageSize = plan === "free" ? FREE_PLAN_LEADS_PER_SEARCH : PAGE_SIZE;

  if (plan !== "free") {
    const monthlyLimit = MONTHLY_LEAD_LIMITS[plan as "starter" | "pro" | "agency"];
    if (monthlyLimit !== null && leadsUsedThisMonth >= monthlyLimit) {
      return NextResponse.json(
        {
          error: `You've used all ${monthlyLimit} leads included in your plan this month.`,
          code: "MONTHLY_LIMIT_REACHED",
          plan,
          limit: monthlyLimit,
        },
        { status: 403 }
      );
    }
  }

  const body = (await request.json()) as SearchRequestBody;
  const { city, category } = body;
  // Free tier never paginates past its single capped page of results.
  const page = plan === "free" ? 1 : body.page && body.page > 0 ? body.page : 1;

  if (!CITIES.includes(city as (typeof CITIES)[number])) {
    return NextResponse.json({ error: "Unsupported city." }, { status: 400 });
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json(
      { error: "Unsupported category." },
      { status: 400 }
    );
  }

  // 2. Freshness check.
  const { data: freshnessRow, error: freshnessError } = await admin
    .from("leads")
    .select("last_updated")
    .eq("city", city)
    .eq("category", category)
    .order("last_updated", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (freshnessError) {
    return NextResponse.json({ error: freshnessError.message }, { status: 500 });
  }

  const cacheIsStale = isStale(freshnessRow?.last_updated ?? null);
  let refreshWarning: string | null = null;

  // 3. Refresh from Google Places only if the cache is missing/stale.
  if (cacheIsStale) {
    try {
      const freshLeads = await fetchLeadsFromGooglePlaces(city, category);

      if (freshLeads.length > 0) {
        const refreshDate = new Date().toISOString().slice(0, 10);

        // Replace the old batch for this combo rather than appending,
        // so closed/duplicate businesses don't pile up over time.
        await admin.from("leads").delete().eq("city", city).eq("category", category);

        await admin.from("leads").insert(
          freshLeads.map((lead) => ({
            ...lead,
            city,
            category,
            last_updated: refreshDate,
          }))
        );
      }
    } catch (err) {
      // Don't hard-fail the search if the live API call breaks (e.g.
      // missing API key in local dev) — fall back to whatever is
      // already cached and surface a warning instead.
      refreshWarning =
        err instanceof Error
          ? err.message
          : "Could not refresh live data; showing cached results.";
    }
  }

  // 4. Serve the (now up-to-date, or still-cached) page of results,
  // capped to this plan's page size (5 for free, 20 for paid).
  const from = (page - 1) * effectivePageSize;
  const to = from + effectivePageSize - 1;

  const {
    data: leads,
    count,
    error: pageError,
  } = await admin
    .from("leads")
    .select("*", { count: "exact" })
    .eq("city", city)
    .eq("category", category)
    .order("rating", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (pageError) {
    return NextResponse.json({ error: pageError.message }, { status: 500 });
  }

  // Meter usage for paid plans — free tier is metered by the fixed
  // per-search cap above, not the monthly counter. This counts leads
  // returned per search rather than truly unique leads viewed, which
  // is a deliberate simplification for now (documented in README).
  if (plan !== "free" && leads && leads.length > 0) {
    await admin
      .from("profiles")
      .update({ leads_used_this_month: leadsUsedThisMonth + leads.length })
      .eq("id", user.id);
  }

  const { data: latestRow } = await admin
    .from("leads")
    .select("last_updated")
    .eq("city", city)
    .eq("category", category)
    .order("last_updated", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    leads: leads ?? [],
    totalCount: count ?? 0,
    pageSize: effectivePageSize,
    lastUpdated: latestRow?.last_updated ?? null,
    refreshWarning,
  });
}

function isStale(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true;
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays > CACHE_MAX_AGE_DAYS;
}
