import Link from "next/link";
import { getOrderByNumber } from "@/server/orders";
import { formatMoney } from "@/lib/money";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber).catch(() => null);

  if (!order) {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl text-navy">Order not found</h1>
        <Link href="/" className="mt-4 inline-block text-navy hover:underline">Return home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-red">Order confirmed</p>
      <h1 className="mt-2 font-display text-3xl text-navy">{order.order_number}</h1>
      <p className="mt-4 text-muted">
        Thank you for your order. We will contact you to confirm delivery details.
      </p>
      <p className="mt-6 text-2xl font-semibold tabular-nums text-navy">{formatMoney(order.total_minor)}</p>
      <p className="mt-2 text-sm text-muted">Payment: Cash on delivery</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/account/orders" className="rounded-full bg-navy px-6 py-3 text-sm text-white">
          View orders
        </Link>
        <Link href="/shop" className="rounded-full border border-navy/15 px-6 py-3 text-sm text-navy">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
