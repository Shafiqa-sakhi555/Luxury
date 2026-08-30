import Link from "next/link";
import { getOrderByNumber } from "@/server/orders";
import { formatMoney } from "@/lib/money";
import { CopyOrderNumber } from "@/components/commerce/CopyOrderNumber";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(decodeURIComponent(orderNumber)).catch(() => null);

  if (!order) {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl text-navy">Order not found</h1>
        <Link href="/" className="mt-4 inline-block text-navy hover:underline">
          Return home
        </Link>
      </div>
    );
  }

  const trackHref = `/track/${encodeURIComponent(order.order_number)}`;

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-red">Order received</p>
      <h1 className="mt-2 font-display text-3xl text-navy">{order.order_number}</h1>
      <div className="mt-3 flex justify-center">
        <CopyOrderNumber orderNumber={order.order_number} />
      </div>

      <div className="mt-6 rounded-2xl border border-navy/10 bg-brand-50 px-5 py-4 text-left">
        <p className="text-sm font-semibold text-navy">Save this order ID</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Keep <span className="font-medium text-navy">{order.order_number}</span> to trace your
          order. Paste it in the homepage search and tap <strong>Trace order</strong> — no account
          needed.
        </p>
      </div>

      <p className="mt-5 text-muted">
        Thank you for your order. Our team will review and confirm it shortly.
      </p>
      <p className="mt-6 text-2xl font-semibold tabular-nums text-navy">{formatMoney(order.total_minor)}</p>
      <p className="mt-2 text-sm text-muted">Payment: Cash on delivery</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={trackHref} className="rounded-full bg-navy px-6 py-3 text-sm text-white">
          Trace this order
        </Link>
        <Link href="/shop" className="rounded-full border border-navy/15 px-6 py-3 text-sm text-navy">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
