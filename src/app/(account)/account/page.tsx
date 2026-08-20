import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_minor: number;
  }> = [];

  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (customer) {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total_minor")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      orders = data ?? [];
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-navy sm:text-3xl">Overview</h2>
      <p className="mt-2 text-sm text-muted">Your orders and saved details at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <p className="text-xs uppercase tracking-wide text-muted">Orders</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-navy">{orders.length}</p>
          <Link href="/account/orders" className="mt-2 block text-sm text-red hover:underline">
            View all
          </Link>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase tracking-wide text-muted">Wishlist</p>
          <Link href="/account/wishlist" className="mt-2 block text-sm text-red hover:underline">
            View items
          </Link>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase tracking-wide text-muted">Addresses</p>
          <Link href="/account/addresses" className="mt-2 block text-sm text-red hover:underline">
            Manage
          </Link>
        </Card>
      </div>

      {orders.length > 0 ? (
        <div className="mt-10">
          <h3 className="font-medium text-navy">Recent orders</h3>
          <ul className="mt-4 space-y-3">
            {orders.slice(0, 3).map((order) => (
              <li key={order.id}>
                <Card padding="md" className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-xs capitalize text-muted">{order.status.replace(/_/g, " ")}</p>
                  </div>
                  <span className="shrink-0 tabular-nums font-medium">
                    {formatMoney(order.total_minor)}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          className="mt-10 surface-card"
          icon={<Package className="h-6 w-6" />}
          title="No orders yet"
          description="When you place an order, it will appear here with tracking and details."
          action={{ label: "Start shopping", href: "/shop" }}
        />
      )}
    </div>
  );
}
