import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { getOrderByNumber } from "@/server/orders";
import { formatMoney } from "@/lib/money";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const customer = session?.user?.id
    ? await db.customer.findUnique({ where: { userId: session.user.id } })
    : null;
  if (!customer) notFound();

  const { id } = await params;
  const order = await db.order.findFirst({
    where: { id, customerId: customer.id },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-muted hover:text-navy">← Orders</Link>
      <h1 className="mt-4 font-display text-3xl text-navy">{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-muted">Status: {order.status}</p>
      <ul className="mt-8 space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between rounded-xl border border-navy/10 bg-white p-4 text-sm">
            <div>
              <p className="font-medium text-navy">{item.productName}</p>
              <p className="text-xs text-muted">{item.variantSku} × {item.quantity}</p>
            </div>
            <span className="tabular-nums">{formatMoney(item.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-right text-lg font-semibold tabular-nums">{formatMoney(order.totalMinor)}</p>
    </div>
  );
}
