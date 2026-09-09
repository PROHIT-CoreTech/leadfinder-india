import Link from "next/link";
import {
  Search,
  PhoneCall,
  Download,
  ShieldCheck,
  MapPin,
  Check,
  Quote,
} from "lucide-react";
import { PLAN_DETAILS } from "@/lib/types";
import { FaqAccordion } from "@/components/landing/FaqAccordion";

const STEPS = [
  {
    icon: Search,
    title: "Pick a city and category",
    description:
      "Manufacturing in Pune, IT startups in Bengaluru — whatever your niche is.",
  },
  {
    icon: MapPin,
    title: "Get verified contacts",
    description: "Business name, phone, rating, and address — no manual scraping.",
  },
  {
    icon: PhoneCall,
    title: "Track every call",
    description: "Log status, notes, and follow-ups without leaving the app.",
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Verified local data",
    description:
      "Leads are sourced from Google Places and kept fresh with a rolling data refresh.",
  },
  {
    icon: Download,
    title: "One-click CSV export",
    description: "Pull your search results into a spreadsheet whenever you need to.",
  },
  {
    icon: PhoneCall,
    title: "Built-in call CRM",
    description:
      "Status, notes, and follow-up reminders for every lead — in one pipeline view.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Indian payments",
    description: "Subscriptions run on Razorpay — UPI, cards, and netbanking supported.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <header className="border-b border-panel-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
              L
            </span>
            <span className="text-sm font-semibold text-ink">LeadFinder India</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-soft hover:text-ink">
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          Built for Indian agencies and freelancers
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          Verified local business leads, without the manual Google Maps grind
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-soft sm:text-lg">
          Search by city and category, get verified phone numbers and
          contact details, and track every call in one place — built for
          agencies and freelancers selling into Indian small businesses.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="w-full rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover sm:w-auto"
          >
            Start free — no card required
          </Link>
          <a
            href="#pricing"
            className="w-full rounded-md border border-panel-border bg-panel px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface sm:w-auto"
          >
            See pricing
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-panel-border bg-panel py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-semibold text-ink sm:text-2xl">
            How it works
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <step.icon size={18} strokeWidth={1.75} />
                </div>
                <p className="text-xs font-medium text-ink-faint">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-sm font-medium text-ink">{step.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-semibold text-ink sm:text-2xl">
            Everything you need to prospect locally
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-lg border border-panel-border bg-panel p-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <feature.icon size={16} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{feature.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-panel-border bg-panel py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-semibold text-ink sm:text-2xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-center text-sm text-ink-soft">
            No hidden fees. Cancel anytime.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_DETAILS.map((plan) => (
              <div
                key={plan.key}
                className="flex flex-col rounded-lg border border-panel-border bg-surface p-5"
              >
                <p className="text-sm font-medium text-ink-soft">{plan.label}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {plan.priceDisplay}
                  <span className="text-sm font-normal text-ink-faint">
                    {plan.priceSuffix}
                  </span>
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f.text}
                      className="flex items-start gap-2 text-sm text-ink-soft"
                    >
                      <Check
                        size={14}
                        className="mt-0.5 shrink-0 text-green"
                        strokeWidth={2}
                      />
                      {f.text}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="mt-5 block rounded-md bg-accent px-3 py-2 text-center text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials (placeholder) */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-semibold text-ink sm:text-2xl">
            What early users are saying
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-dashed border-panel-border bg-panel p-6 text-left"
              >
                <Quote size={18} className="text-ink-faint" strokeWidth={1.75} />
                <p className="mt-3 text-sm text-ink-faint">
                  Customer testimonials will go here as early agencies come
                  on board — this section is a placeholder for now.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-panel-border bg-panel py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-semibold text-ink sm:text-2xl">
            Frequently asked questions
          </h2>
          <div className="mt-10">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center">
        <h2 className="text-xl font-semibold text-ink sm:text-2xl">
          Ready to stop scraping Google Maps by hand?
        </h2>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Start free today
        </Link>
      </section>

      <footer className="border-t border-panel-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-ink-faint sm:px-6">
          © {new Date().getFullYear()} LeadFinder India. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
