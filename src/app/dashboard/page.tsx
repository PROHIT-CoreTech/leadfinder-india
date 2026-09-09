"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Globe, RefreshCw, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/profile-context";
import { RatingBadge } from "@/components/RatingStars";
import { ExportCsvButton, LockedFeatureButton } from "@/components/UpgradeLock";
import { CallStatusBadge } from "@/components/CallStatusBadge";
import { CallLogModal } from "@/components/CallLogModal";
import { LimitReachedState } from "@/components/LimitReachedState";
import {
  CITIES,
  CATEGORIES,
  PAGE_SIZE,
  CSV_EXPORT_PLANS,
  CRM_ACCESS_PLANS,
  type Lead,
  type CallLog,
} from "@/lib/types";

export default function DashboardPage() {
  const { profile } = useProfile();
  const supabase = createClient();

  const [city, setCity] = useState<string>(
    (profile.primary_city as string) || CITIES[0]
  );
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [callLogs, setCallLogs] = useState<Record<string, CallLog>>({});
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canExportCsv = CSV_EXPORT_PLANS.includes(profile.plan);
  const canUseCrm = CRM_ACCESS_PLANS.includes(profile.plan);

  async function runSearch(targetPage: number) {
    setLoading(true);
    setError(null);
    setLimitReached(false);

    try {
      const response = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, category, page: targetPage }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === "MONTHLY_LIMIT_REACHED") {
          setLimitReached(true);
          setLeads([]);
          setTotalCount(0);
          setHasSearched(true);
          setLoading(false);
          return;
        }
        throw new Error(result.error ?? "Something went wrong.");
      }

      const newLeads: Lead[] = result.leads ?? [];
      setLeads(newLeads);
      setTotalCount(result.totalCount ?? 0);
      setPageSize(result.pageSize ?? PAGE_SIZE);
      setLastUpdated(result.lastUpdated ?? null);
      setRefreshWarning(result.refreshWarning ?? null);
      setPage(targetPage);

      await loadCallLogs(newLeads.map((lead) => lead.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLeads([]);
      setTotalCount(0);
    }

    setHasSearched(true);
    setLoading(false);
  }

  async function loadCallLogs(leadIds: string[]) {
    if (leadIds.length === 0) {
      setCallLogs({});
      return;
    }

    const { data } = await supabase
      .from("call_logs")
      .select("*")
      .in("lead_id", leadIds);

    const map: Record<string, CallLog> = {};
    (data ?? []).forEach((log) => {
      map[log.lead_id] = log as CallLog;
    });
    setCallLogs(map);
  }

  function handleCallLogSaved(log: CallLog) {
    setCallLogs((prev) => ({ ...prev, [log.lead_id]: log }));
    setActiveLead(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(1);
  }

  function handleExportCsv() {
    if (leads.length === 0) return;

    const headers = [
      "Business Name",
      "Phone",
      "Email",
      "Rating",
      "Address",
      "Website",
    ];
    const rows = leads.map((lead) => [
      lead.business_name,
      lead.phone ?? "",
      lead.email ?? "",
      lead.rating?.toString() ?? "",
      lead.address ?? "",
      lead.website ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leadfinder-${city.toLowerCase()}-${category.toLowerCase()}-page${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Search leads</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Pick a city and category to pull verified business contacts.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col gap-3 rounded-lg border border-panel-border bg-panel p-4 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="w-full sm:w-auto">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">
            City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink focus:border-accent sm:w-auto"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink focus:border-accent sm:w-auto"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
        >
          <Search size={15} strokeWidth={2} />
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-md bg-red-soft px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      {refreshWarning && (
        <p className="mb-4 rounded-md bg-amber-soft px-3 py-2 text-sm text-amber">
          Couldn&apos;t refresh live data ({refreshWarning}) — showing the
          most recent cached results instead.
        </p>
      )}

      {limitReached && (
        <LimitReachedState
          plan={profile.plan}
          headline={`You've used all your leads for this month on the ${profile.plan} plan.`}
        />
      )}

      {hasSearched && !error && !limitReached && (
        <div className="rounded-lg border border-panel-border bg-panel">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-panel-border px-4 py-3">
            <div>
              <p className="text-sm text-ink-soft">
                {totalCount} lead{totalCount === 1 ? "" : "s"} found in {city}{" "}
                · {category}
              </p>
              {lastUpdated && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                  <RefreshCw size={11} strokeWidth={1.75} />
                  Data last refreshed: {formatDate(lastUpdated)}
                </p>
              )}
            </div>
            <ExportCsvButton allowed={canExportCsv} onExport={handleExportCsv} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-panel-border text-xs text-ink-faint">
                  <th className="px-4 py-2.5 font-medium">Business name</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Rating</th>
                  <th className="px-4 py-2.5 font-medium">Address</th>
                  <th className="px-4 py-2.5 font-medium">Website</th>
                  <th className="px-4 py-2.5 font-medium">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-panel-border last:border-0 hover:bg-surface"
                  >
                    <td className="px-4 py-2.5 font-medium text-ink">
                      {lead.business_name}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {lead.phone ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {lead.email ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <RatingBadge rating={lead.rating} />
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {lead.address ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                          <Globe size={13} strokeWidth={1.75} />
                          Visit
                        </a>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {!canUseCrm ? (
                        <LockedFeatureButton label="Log call" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveLead(lead)}
                          className="inline-flex items-center gap-1 rounded-md border border-panel-border px-2 py-1 text-xs text-ink-soft transition-colors hover:bg-white"
                        >
                          {callLogs[lead.id] ? (
                            <CallStatusBadge status={callLogs[lead.id].status} />
                          ) : (
                            <>
                              <Phone size={12} strokeWidth={1.75} />
                              Log call
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {leads.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-ink-soft"
                    >
                      No leads found for {city} · {category} yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {profile.plan === "free" && totalCount > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-panel-border bg-accent-soft px-4 py-3 text-xs text-accent">
              <span>
                Showing {pageSize} of {totalCount} leads found — upgrade to
                Starter for 100 leads/month.
              </span>
              <a
                href="/dashboard/billing"
                className="font-medium underline hover:no-underline"
              >
                View plans
              </a>
            </div>
          )}

          {profile.plan !== "free" && totalCount > pageSize && (
            <div className="flex items-center justify-between border-t border-panel-border px-4 py-3">
              <span className="text-xs text-ink-faint">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => runSearch(page - 1)}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-md border border-panel-border px-2.5 py-1.5 text-xs text-ink disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => runSearch(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="inline-flex items-center gap-1 rounded-md border border-panel-border px-2.5 py-1.5 text-xs text-ink disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="rounded-lg border border-dashed border-panel-border px-4 py-14 text-center">
          <p className="text-sm text-ink-soft">
            Choose a city and category above, then search to see leads here.
          </p>
        </div>
      )}

      {activeLead && (
        <CallLogModal
          lead={activeLead}
          existingLog={callLogs[activeLead.id] ?? null}
          onClose={() => setActiveLead(null)}
          onSaved={handleCallLogSaved}
        />
      )}
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

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
