import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileProvider } from "@/lib/profile-context";
import { DashboardShell } from "@/components/DashboardShell";
import type { Profile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, plan, leads_used_this_month, razorpay_customer_id, razorpay_subscription_id, subscription_status, next_billing_at, usage_reset_at, business_type, primary_city, onboarding_completed"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "dashboard layout: profile fetch failed",
      JSON.stringify({
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      })
    );
  }

  if (!profileRow?.onboarding_completed) {
    redirect("/onboarding");
  }

  const profile: Profile = profileRow;

  return (
    <ProfileProvider profile={profile} email={user.email ?? ""}>
      <DashboardShell>{children}</DashboardShell>
    </ProfileProvider>
  );
}
