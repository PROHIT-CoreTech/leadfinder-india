import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadFinder India — Verified local business leads",
  description:
    "Search verified local business leads by city and category, and track every call in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
