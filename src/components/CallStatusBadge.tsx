import { CALL_STATUS_LABELS, type CallStatus } from "@/lib/types";

const STATUS_STYLES: Record<CallStatus, string> = {
  not_called: "bg-surface text-ink-soft",
  called_interested: "bg-green-soft text-green",
  called_not_interested: "bg-red-soft text-red",
  follow_up_scheduled: "bg-accent-soft text-accent",
};

export function CallStatusBadge({ status }: { status: CallStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {CALL_STATUS_LABELS[status]}
    </span>
  );
}
