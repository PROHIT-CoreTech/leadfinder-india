"use client";

import { useState } from "react";
import { Lock, Download } from "lucide-react";

export function ExportCsvButton({
  allowed,
  onExport,
}: {
  allowed: boolean;
  onExport: () => void;
}) {
  const [showTip, setShowTip] = useState(false);

  if (allowed) {
    return (
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
      >
        <Download size={14} strokeWidth={1.75} />
        Download as CSV
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-panel-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-faint"
      >
        <Lock size={14} strokeWidth={1.75} />
        Download as CSV
      </button>
      {showTip && (
        <div className="absolute left-0 top-full z-10 mt-1.5 w-44 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">
          Upgrade to export leads to CSV
        </div>
      )}
    </div>
  );
}

/**
 * Generic small locked-feature button — same visible-but-disabled
 * pattern as ExportCsvButton, reused for the CRM ("Log call") action
 * so free/Starter users see it's there without being able to use it.
 */
export function LockedFeatureButton({
  label,
  icon: Icon = Lock,
}: {
  label: string;
  icon?: typeof Lock;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-panel-border bg-surface px-2 py-1 text-xs text-ink-faint"
      >
        <Icon size={12} strokeWidth={1.75} />
        {label}
      </button>
      {showTip && (
        <div className="absolute left-0 top-full z-10 mt-1.5 w-40 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">
          Upgrade to unlock
        </div>
      )}
    </div>
  );
}
