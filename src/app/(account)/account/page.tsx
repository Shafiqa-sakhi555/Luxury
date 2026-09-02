import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Heart, MapPin, Package, Settings } from "lucide-react";

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

  const shortcuts = [
    {
      label: "Orders",
      value: String(orders.length),
      href: "/account/orders",
      cta: "View all",
      icon: Package,
    },
    {
      label: "Wishlist",
      value: "Saved items",
      href: "/account/wishlist",
      cta: "View items",
      icon: Heart,
    },
    {
      label: "Addresses",
      value: "Delivery",
      href: "/account/addresses",
      cta: "Manage",
      icon: MapPin,
    },
    {
      label: "Settings",
      value: "Security",
      href: "/account/settings",
      cta: "Change password",
      icon: Settings,
    },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl tracking-tight text-navy sm:text-3xl">Overview</h2>
      <p className="mt-2 text-sm text-muted">Your orders and saved details at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} padding="md" className="relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-2 font-display text-2xl font-light text-navy">{item.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red/8 text-red">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <Link href={item.href} className="mt-3 inline-block text-sm font-medium text-red hover:underline">
                {item.cta}
              </Link>
            </Card>
          );
        })}
      </div>

      {orders.length > 0 ? (
        <div className="mt-10">
          <h3 className="font-display text-xl text-navy">Recent orders</h3>
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
                  <span className="shrink-0 font-display text-lg tabular-nums text-navy">
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
