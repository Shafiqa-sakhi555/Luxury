import Link from "next/link";
import { auth } from "@/lib/auth";
import { listCustomerOrders } from "@/server/orders";
import { db } from "@/server/db";
import { formatMoney } from "@/lib/money";

export default async function AccountPage() {
  const session = await auth();
  const customer = session?.user?.id
    ? await db.customer.findUnique({ where: { userId: session.user.id } })
    : null;
  const orders = customer ? await listCustomerOrders(customer.id).catch(() => []) : [];

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Welcome back</h1>
      <p className="mt-2 text-muted">{session?.user?.email}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Orders</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Wishlist</p>
          <Link href="/account/wishlist" className="mt-2 block text-sm text-navy hover:underline">View items</Link>
        </div>
        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Addresses</p>
          <Link href="/account/addresses" className="mt-2 block text-sm text-navy hover:underline">Manage</Link>
        </div>
      </div>
      {orders.length > 0 && (
        <div className="mt-10">
          <h2 className="font-medium text-navy">Recent orders</h2>
          <ul className="mt-4 space-y-3">
            {orders.slice(0, 3).map((order) => (
              <li key={order.id} className="flex items-center justify-between rounded-xl border border-navy/10 bg-white p-4 text-sm">
                <div>
                  <Link href={`/account/orders/${order.id}`} className="font-medium text-navy hover:underline">
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted">{order.status}</p>
                </div>
                <span className="tabular-nums">{formatMoney(order.totalMinor)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
