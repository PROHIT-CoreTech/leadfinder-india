"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, PhoneCall, CreditCard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/profile-context";
import { PLAN_LABELS, FREE_PLAN_LEADS_PER_SEARCH, MONTHLY_LEAD_LIMITS } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Search leads", icon: LayoutGrid },
  { href: "/dashboard/pipeline", label: "My pipeline", icon: PhoneCall },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, email } = useProfile();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const monthlyLimit =
    profile.plan === "free" ? null : MONTHLY_LEAD_LIMITS[profile.plan];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-text">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
          L
        </span>
        <span className="text-sm font-semibold text-sidebar-text-active">
          LeadFinder India
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-white/10 text-sidebar-text-active"
                  : "hover:bg-white/5 hover:text-sidebar-text-active"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="mb-3 rounded-md border border-sidebar-border bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-sidebar-text-active">
              {PLAN_LABELS[profile.plan]} plan
            </span>
            {profile.plan === "free" && (
              <Link href="/dashboard/billing" className="text-accent hover:underline">
                Upgrade
              </Link>
            )}
          </div>
          <p className="mt-1 text-xs text-sidebar-text">
            {profile.plan === "free"
              ? `${FREE_PLAN_LEADS_PER_SEARCH} leads shown per search`
              : monthlyLimit
              ? `${profile.leads_used_this_month} of ${monthlyLimit} leads used this month`
              : `${profile.leads_used_this_month} leads used — unlimited`}
          </p>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="truncate text-xs text-sidebar-text" title={email}>
            {email}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className="rounded p-1 text-sidebar-text hover:text-sidebar-text-active"
          >
            <LogOut size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
