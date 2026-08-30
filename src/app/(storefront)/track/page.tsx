import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TrackOrderForm } from "@/components/commerce/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track order",
  description: "Trace your Jalal's Home Solution order with the ID you received after checkout.",
};

export default function TrackOrderIndexPage() {
  return (
    <section className="section-brand-light section-spacing-md pt-28">
      <PageContainer width="narrow">
        <SectionHeading
          eyebrow="Orders"
          title="Trace your order"
          description="Paste the order ID from your confirmation screen or email — it looks like JHS-853457-Q5QNGL. No account needed."
        />
        <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
          <TrackOrderForm />
        </div>
      </PageContainer>
    </section>
  );
}
