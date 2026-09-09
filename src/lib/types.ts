export type Plan = "free" | "starter" | "pro" | "agency";

export interface Lead {
  id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  rating: number | null;
  address: string | null;
  website: string | null;
  city: string;
  category: string;
  last_updated: string;
}

export type SubscriptionStatus = "none" | "active" | "cancelled";
export type BusinessType = "agency" | "freelancer" | "business";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  agency: "Agency",
  freelancer: "Freelancer",
  business: "Business",
};

export interface Profile {
  id: string;
  plan: Plan;
  leads_used_this_month: number;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  next_billing_at: string | null;
  usage_reset_at: string;
  business_type: BusinessType | null;
  primary_city: string | null;
  onboarding_completed: boolean;
}

export type CallStatus =
  | "not_called"
  | "called_interested"
  | "called_not_interested"
  | "follow_up_scheduled";

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  not_called: "Not called",
  called_interested: "Called — Interested",
  called_not_interested: "Called — Not interested",
  follow_up_scheduled: "Follow-up scheduled",
};

export const CALL_STATUS_OPTIONS: CallStatus[] = [
  "not_called",
  "called_interested",
  "called_not_interested",
  "follow_up_scheduled",
];

export interface CallLog {
  id: string;
  user_id: string;
  lead_id: string;
  status: CallStatus;
  notes: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineEntry extends CallLog {
  leads: Lead;
}

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

export const CITIES = [
  "Pune",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Ahmedabad",
] as const;
export const CATEGORIES = [
  "Manufacturing",
  "Retail & Trading",
  "IT Services & Startups",
  "E-commerce Sellers",
  "Real Estate",
] as const;

export const PAGE_SIZE = 20;

// A city+category combination is only re-fetched from the live Google
// Places API once its cached rows are older than this many days.
export const CACHE_MAX_AGE_DAYS = 30;

// Plans that are allowed to export search results as CSV.
export const CSV_EXPORT_PLANS: Plan[] = ["starter", "pro", "agency"];

// Plans that can use the call tracking CRM (log calls, My Pipeline).
// Starter deliberately does NOT include CRM access — only leads + CSV.
export const CRM_ACCESS_PLANS: Plan[] = ["pro", "agency"];

// Paid plans that go through Razorpay checkout.
export type PaidPlan = Exclude<Plan, "free">;
export const PAID_PLANS: PaidPlan[] = ["starter", "pro", "agency"];

// How many leads each plan can view. Free is a per-search cap (every
// search truncates to this many rows); paid plans are a rolling
// monthly cap tracked via `leads_used_this_month` / `usage_reset_at`.
export const FREE_PLAN_LEADS_PER_SEARCH = 5;
export const MONTHLY_LEAD_LIMITS: Record<PaidPlan, number | null> = {
  starter: 100,
  pro: 500,
  agency: null, // unlimited
};

export interface PlanFeature {
  text: string;
}

export interface PlanDetails {
  key: Plan;
  label: string;
  priceDisplay: string;
  priceSuffix: string;
  features: PlanFeature[];
}

export const PLAN_DETAILS: PlanDetails[] = [
  {
    key: "free",
    label: "Free",
    priceDisplay: "₹0",
    priceSuffix: "",
    features: [
      { text: "5 leads per search" },
      { text: "No CSV export" },
      { text: "No call CRM access" },
    ],
  },
  {
    key: "starter",
    label: "Starter",
    priceDisplay: "₹499",
    priceSuffix: "/month",
    features: [
      { text: "100 leads / month" },
      { text: "CSV export" },
      { text: "No call CRM access" },
    ],
  },
  {
    key: "pro",
    label: "Pro",
    priceDisplay: "₹999",
    priceSuffix: "/month",
    features: [
      { text: "500 leads / month" },
      { text: "CSV export" },
      { text: "Full call CRM access" },
    ],
  },
  {
    key: "agency",
    label: "Agency",
    priceDisplay: "₹2,499",
    priceSuffix: "/month",
    features: [
      { text: "Unlimited leads" },
      { text: "CSV export" },
      { text: "Full call CRM access" },
      { text: "3 team member seats" },
    ],
  },
];
