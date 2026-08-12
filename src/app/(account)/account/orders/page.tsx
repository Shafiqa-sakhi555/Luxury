import Link from "next/link";
import { auth } from "@/lib/auth";
import { listCustomerOrders } from "@/server/orders";
import { db } from "@/server/db";
import { formatMoney } from "@/lib/money";

export default async function AccountOrdersPage() {
  const session = await auth();
  const customer = session?.user?.id
    ? await db.customer.findUnique({ where: { userId: session.user.id } })
    : null;
  const orders = customer ? await listCustomerOrders(customer.id).catch(() => []) : [];

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Orders</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-muted">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-navy/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/account/orders/${order.id}`} className="font-medium text-navy hover:underline">
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums font-medium">{formatMoney(order.totalMinor)}</p>
                  <p className="text-xs text-muted">{order.status}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
