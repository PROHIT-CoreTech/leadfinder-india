"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Which cities and categories are supported right now?",
    a: "Pune, Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, and Ahmedabad, across Manufacturing, Retail & Trading, IT Services & Startups, E-commerce Sellers, and Real Estate. More cities and categories are added as demand comes in.",
  },
  {
    q: "Where does the lead data come from?",
    a: "Google Places, refreshed on a rolling basis so listings stay current without re-fetching on every single search.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan itself works as a trial — 5 leads per search, no time limit, no card required. Upgrade whenever you need more volume or the call CRM.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel from the Billing page with one click. You'll move back to the Free plan immediately, no lock-in.",
  },
  {
    q: "Is payment secure?",
    a: "All subscriptions run through Razorpay, so LeadFinder India never sees or stores your card details.",
  },
  {
    q: "Does the call CRM come with every plan?",
    a: "It's included on Pro and Agency. Starter includes leads and CSV export but not the call tracker.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-panel-border rounded-lg border border-panel-border bg-panel">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-ink">{faq.q}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className={`shrink-0 text-ink-faint transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <p className="px-5 pb-4 text-sm text-ink-soft">{faq.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
