import Link from "next/link";
import { Package } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { CustomerOrderStatusBadge } from "@/components/account/CustomerOrderStatusBadge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AccountOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_minor: number;
    created_at: string;
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
        .select("id, order_number, status, total_minor, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      orders = data ?? [];
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-navy sm:text-3xl">Orders</h2>
      <p className="mt-2 text-sm text-muted">Track and review your purchase history.</p>

      {orders.length === 0 ? (
        <EmptyState
          className="mt-8 surface-card"
          icon={<Package className="h-6 w-6" />}
          title="No orders yet"
          description="Your order history will show up here once you complete a purchase."
          action={{ label: "Browse shop", href: "/shop" }}
        />
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Card padding="md">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-muted">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">{formatMoney(order.total_minor)}</p>
                    <div className="mt-1 flex justify-end">
                      <CustomerOrderStatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
