"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      q: "How do I start investing?",
      a: "Create an account, complete verification, and deposit funds into any vault of your choice. The entire process takes just 5 minutes.",
    },
    {
      q: "Are my funds safe?",
      a: "Yes. All vaults are managed by verified professionals and protected by smart contract audits. We also maintain insurance coverage for additional protection.",
    },
    {
      q: "What are the fees?",
      a: "We charge transparent management fees that vary by vault, typically 1-2%. You can see all fees before investing and there are no hidden charges.",
    },
    {
      q: "Can I withdraw anytime?",
      a: "Yes, you can withdraw your funds at any time with no lockup periods or penalties. Withdrawals are processed instantly on-chain.",
    },
  ]

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">Find answers to common questions about Clearpool</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                className="w-full p-6 flex items-center justify-between hover:bg-primary/3 transition-colors"
              >
                <h3 className="font-semibold text-foreground text-left text-lg">{faq.q}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-primary flex-shrink-0 ml-4 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 py-4 border-t border-border bg-primary/3">
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
