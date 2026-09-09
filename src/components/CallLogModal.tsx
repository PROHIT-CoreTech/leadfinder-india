"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/profile-context";
import {
  isoToDateInputValue,
  isoToTimeInputValue,
  combineDateTimeToISO,
} from "@/lib/datetime";
import {
  CALL_STATUS_OPTIONS,
  CALL_STATUS_LABELS,
  type CallLog,
  type CallStatus,
  type Lead,
} from "@/lib/types";

export function CallLogModal({
  lead,
  existingLog,
  onClose,
  onSaved,
}: {
  lead: Lead;
  existingLog: CallLog | null;
  onClose: () => void;
  onSaved: (log: CallLog) => void;
}) {
  const { profile } = useProfile();
  const supabase = createClient();

  const [status, setStatus] = useState<CallStatus>(
    existingLog?.status ?? "not_called"
  );
  const [notes, setNotes] = useState(existingLog?.notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(
    isoToDateInputValue(existingLog?.follow_up_at ?? null)
  );
  const [followUpTime, setFollowUpTime] = useState(
    isoToTimeInputValue(existingLog?.follow_up_at ?? null)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("call_logs")
      .upsert(
        {
          user_id: profile.id,
          lead_id: lead.id,
          status,
          notes: notes.trim() || null,
          follow_up_at: combineDateTimeToISO(followUpDate, followUpTime),
        },
        { onConflict: "user_id,lead_id" }
      )
      .select()
      .single();

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    onSaved(data as CallLog);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-panel-border bg-panel shadow-xl">
        <div className="flex items-center justify-between border-b border-panel-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Log call — {lead.business_name}
            </h2>
            <p className="text-xs text-ink-faint">{lead.city} · {lead.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-faint hover:bg-surface hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Call status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CallStatus)}
              className="w-full rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink focus:border-accent"
            >
              {CALL_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {CALL_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What did you discuss?"
              className="w-full rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Follow-up date &amp; time (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink focus:border-accent"
              />
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-32 rounded-md border border-panel-border bg-white px-3 py-2 text-sm text-ink focus:border-accent"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-red-soft px-3 py-2 text-sm text-red">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-panel-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-panel-border px-3 py-1.5 text-sm text-ink hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
