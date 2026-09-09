"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Phone, PhoneCall, CalendarClock, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/profile-context";
import { CallStatusBadge } from "@/components/CallStatusBadge";
import { CallLogModal } from "@/components/CallLogModal";
import {
  formatFollowUp,
  isOverdue,
  isToday,
  startOfCurrentMonthISO,
} from "@/lib/datetime";
import type { PipelineEntry, CallLog } from "@/lib/types";
import { CRM_ACCESS_PLANS } from "@/lib/types";
import Link from "next/link";
import { Lock } from "lucide-react";

type SortDirection = "asc" | "desc";

export default function PipelinePage() {
  const { profile } = useProfile();
  const supabase = createClient();

  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [editingEntry, setEditingEntry] = useState<PipelineEntry | null>(null);
  const canUseCrm = CRM_ACCESS_PLANS.includes(profile.plan);

  async function loadPipeline() {
    if (!canUseCrm) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("call_logs")
      .select("*, leads(*)")
      .eq("user_id", profile.id);

    if (error) {
      setError(error.message);
    } else {
      setEntries((data ?? []) as PipelineEntry[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data load on mount, not syncing with an external system
    loadPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSaved(log: CallLog) {
    setEntries((prev) => {
      const existingIndex = prev.findIndex((e) => e.lead_id === log.lead_id);
      if (existingIndex === -1) return prev; // shouldn't happen from this page
      const updated = [...prev];
      updated[existingIndex] = { ...updated[existingIndex], ...log };
      return updated;
    });
    setEditingEntry(null);
  }

  const summary = useMemo(() => {
    const monthStart = startOfCurrentMonthISO();

    const contactedThisMonth = entries.filter(
      (e) => e.status !== "not_called" && e.created_at >= monthStart
    ).length;

    const followUpsDueToday = entries.filter(
      (e) => e.status === "follow_up_scheduled" && isToday(e.follow_up_at)
    ).length;

    const interested = entries.filter(
      (e) => e.status === "called_interested"
    ).length;
    const notInterested = entries.filter(
      (e) => e.status === "called_not_interested"
    ).length;
    const totalCalled = interested + notInterested;
    const conversionRate =
      totalCalled === 0 ? null : Math.round((interested / totalCalled) * 100);

    return { contactedThisMonth, followUpsDueToday, conversionRate };
  }, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (!a.follow_up_at && !b.follow_up_at) return 0;
      if (!a.follow_up_at) return 1; // no follow-up date sorts last
      if (!b.follow_up_at) return -1;
      const diff =
        new Date(a.follow_up_at).getTime() - new Date(b.follow_up_at).getTime();
      return sortDirection === "asc" ? diff : -diff;
    });
  }, [entries, sortDirection]);

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">My pipeline</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every lead you&apos;ve logged a call for, in one place.
        </p>
      </div>

      {!canUseCrm ? (
        <div className="rounded-lg border border-dashed border-panel-border px-4 py-16 text-center">
          <Lock className="mx-auto mb-3 text-ink-faint" size={22} strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink">
            The call CRM is a Pro and Agency feature.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
            Upgrade to track call status, notes, and follow-ups for every
            lead in one pipeline.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Upgrade to unlock
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={PhoneCall}
          label="Contacted this month"
          value={summary.contactedThisMonth.toString()}
        />
        <SummaryCard
          icon={CalendarClock}
          label="Follow-ups due today"
          value={summary.followUpsDueToday.toString()}
          highlight={summary.followUpsDueToday > 0}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Conversion rate"
          value={
            summary.conversionRate === null ? "—" : `${summary.conversionRate}%`
          }
        />
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-soft px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-lg border border-dashed border-panel-border px-4 py-14 text-center">
          <p className="text-sm text-ink-soft">Loading your pipeline…</p>
        </div>
      ) : sortedEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-panel-border px-4 py-14 text-center">
          <p className="text-sm text-ink-soft">
            No leads logged yet — hit &quot;Log call&quot; on any lead from the
            search page to start tracking it here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-panel-border bg-panel">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-panel-border text-xs text-ink-faint">
                <th className="px-4 py-2.5 font-medium">Business name</th>
                <th className="px-4 py-2.5 font-medium">City / Category</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">
                  <button
                    type="button"
                    onClick={() =>
                      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                    }
                    className="inline-flex items-center gap-1 hover:text-ink"
                  >
                    Follow-up
                    <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-medium">Notes</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => {
                const overdue =
                  entry.status === "follow_up_scheduled" &&
                  isOverdue(entry.follow_up_at);
                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-panel-border last:border-0 ${
                      overdue ? "bg-red-soft" : "hover:bg-surface"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-ink">
                      {entry.leads.business_name}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {entry.leads.city} · {entry.leads.category}
                    </td>
                    <td className="px-4 py-2.5">
                      <CallStatusBadge status={entry.status} />
                    </td>
                    <td
                      className={`px-4 py-2.5 ${
                        overdue ? "font-medium text-red" : "text-ink-soft"
                      }`}
                    >
                      {formatFollowUp(entry.follow_up_at)}
                      {overdue && " · overdue"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-ink-soft">
                      {entry.notes || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setEditingEntry(entry)}
                        className="inline-flex items-center gap-1 rounded-md border border-panel-border px-2 py-1 text-xs text-ink-soft hover:bg-white"
                      >
                        <Phone size={12} strokeWidth={1.75} />
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingEntry && (
        <CallLogModal
          lead={editingEntry.leads}
          existingLog={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={handleSaved}
        />
      )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-panel-border bg-panel px-4 py-3.5">
      <div className="flex items-center gap-2 text-ink-faint">
        <Icon size={14} strokeWidth={1.75} />
        <span className="text-xs">{label}</span>
      </div>
      <p
        className={`mt-1.5 text-2xl font-semibold ${
          highlight ? "text-red" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
