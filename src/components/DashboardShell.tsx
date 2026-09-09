"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

/**
 * Mobile-responsive app shell. On md+ screens the sidebar sits static
 * in the flex row as before. Below md, it becomes a slide-in drawer
 * triggered by a hamburger button in a thin mobile top bar.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-panel-border bg-panel px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded p-1 text-ink hover:bg-surface"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <span className="text-sm font-semibold text-ink">LeadFinder India</span>
          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded p-1 text-ink hover:bg-surface"
              aria-label="Close menu"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          )}
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
