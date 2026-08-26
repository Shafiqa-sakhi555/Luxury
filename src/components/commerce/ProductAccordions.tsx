"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";

type AccordionItem = {
  id: string;
  title: string;
  content: React.ReactNode;
};

export function ProductAccordions({
  description,
  productName,
  specs,
  deliveryFeeLabel = "Rs 2,500",
  freeDeliveryThresholdLabel = "Rs 50,000",
}: {
  description?: string | null;
  productName: string;
  specs?: Array<{ label: string; value: string }>;
  deliveryFeeLabel?: string;
  freeDeliveryThresholdLabel?: string;
}) {
  const items: AccordionItem[] = [
    {
      id: "description",
      title: "Description",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-navy/80">
          {description ? (
            <p className="whitespace-pre-line">{description}</p>
          ) : (
            <p>No detailed description available for this product yet.</p>
          )}
          {specs && specs.length > 0 ? (
            <dl className="grid gap-3 border-t border-navy/10 pt-4 sm:grid-cols-2">
              {specs.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm text-navy">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ),
    },
    {
      id: "shipping",
      title: "Shipping Information",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-navy/80">
          <p>We deliver across Pakistan. Free delivery applies on orders above {freeDeliveryThresholdLabel}.</p>
          <p>Standard delivery fee is {deliveryFeeLabel} for orders below the free delivery threshold.</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/delivery" className="underline underline-offset-2 hover:text-navy">
              Delivery details
            </Link>
            <Link href="/returns" className="underline underline-offset-2 hover:text-navy">
              Returns policy
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "ask",
      title: "Ask a Question",
      content: (
        <div className="space-y-4 text-sm text-navy/80">
          <p>Need help with {productName}? Our team can assist with sizing, fabric, or delivery.</p>
          <OpenAssistantButton
            variant="outline"
            size="lg"
            prompt={`I have a question about ${productName}.`}
            className="w-full rounded-none border-navy bg-white uppercase tracking-[0.08em] hover:bg-navy hover:text-white"
          >
            Ask Jalal Assistance
          </OpenAssistantButton>
        </div>
      ),
    },
  ];

  return (
    <div className="border-t border-navy/15">
      {items.map((item) => (
        <AccordionRow key={item.id} title={item.title}>
          {item.content}
        </AccordionRow>
      ))}
    </div>
  );
}

function AccordionRow({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-navy/15">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy transition hover:text-navy/70"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
