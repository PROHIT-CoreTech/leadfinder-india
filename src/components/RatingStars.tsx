import { Star } from "lucide-react";

export function RatingBadge({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-sm text-ink-faint">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-xs font-medium text-amber">
      <Star size={12} strokeWidth={2} fill="currentColor" />
      {rating.toFixed(1)}
    </span>
  );
}
