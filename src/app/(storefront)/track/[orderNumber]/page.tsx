import type { Metadata } from "next";
import { getPublicOrderTracking } from "@/server/orders/public-tracking";
import { parseOrderNumber } from "@/lib/orders/number";
import { PageContainer } from "@/components/ui/page-container";
import { OrderTrackingView } from "@/components/commerce/OrderTrackingView";
import { TrackOrderForm } from "@/components/commerce/TrackOrderForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);
  const parsed = parseOrderNumber(decoded) ?? decoded.toUpperCase();
  return {
    title: `Track ${parsed}`,
    description: "See the live status of your Jalal's Home Solution order.",
    robots: { index: false, follow: false },
  };
}

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);
  const order = await getPublicOrderTracking(decoded);

  return (
    <section className="section-brand-light section-spacing-md pt-28">
      <PageContainer width="narrow">
        {order ? (
          <OrderTrackingView order={order} />
        ) : (
          <div>
            <h1 className="font-display text-3xl text-navy">Order not found</h1>
            <p className="mt-3 text-sm text-muted">
              We could not find an order for{" "}
              <span className="font-medium text-navy">{decoded.toUpperCase()}</span>. Check the ID
              and try again — it looks like JHS-853457-Q5QNGL.
            </p>
            <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-5">
              <TrackOrderForm initialValue={decoded} />
            </div>
          </div>
        )}
      </PageContainer>
    </section>
  );
}
