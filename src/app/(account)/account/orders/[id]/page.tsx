import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { getOrderStatusMeta } from "@/lib/orders/status";
import { CustomerOrderStatusBadge } from "@/components/account/CustomerOrderStatusBadge";
import { Card } from "@/components/ui/card";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!customer) notFound();

  const { id } = await params;
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!order) notFound();

  const statusMeta = getOrderStatusMeta(order.status);
  const history = [...(order.order_status_history ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-muted hover:text-navy">
        ← Orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">{order.order_number}</h1>
          <p className="mt-1 text-sm text-muted">
            Placed{" "}
            {new Date(order.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <CustomerOrderStatusBadge status={order.status} />
      </div>

      <Card padding="md" className="mt-6">
        <h2 className="text-sm font-semibold text-navy">What this means</h2>
        <p className="mt-2 text-sm text-ink">{statusMeta.meaning}</p>
        <p className="mt-3 text-sm text-muted">{statusMeta.nextSteps}</p>
      </Card>

      <ul className="mt-8 space-y-3">
        {order.order_items.map((item: {
          id: string;
          product_name: string;
          variant_sku: string;
          quantity: number;
          line_total_minor: number;
        }) => (
          <li
            key={item.id}
            className="flex justify-between rounded-xl border border-navy/10 bg-white p-4 text-sm"
          >
            <div>
              <p className="font-medium text-navy">{item.product_name}</p>
              <p className="text-xs text-muted">
                {item.variant_sku} × {item.quantity}
              </p>
            </div>
            <span className="tabular-nums">{formatMoney(item.line_total_minor)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-navy/10 pt-4">
        <span className="text-sm text-muted">Order total</span>
        <span className="text-lg font-semibold tabular-nums">{formatMoney(order.total_minor)}</span>
      </div>

      {history.length > 0 ? (
        <Card padding="md" className="mt-8">
          <h2 className="text-sm font-semibold text-navy">Status updates</h2>
          <ul className="mt-4 space-y-3">
            {history.map((entry: {
              id: string;
              to_status: string;
              reason: string | null;
              created_at: string;
            }) => {
              const entryMeta = getOrderStatusMeta(entry.to_status);
              return (
                <li key={entry.id} className="rounded-lg border border-navy/10 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CustomerOrderStatusBadge status={entry.to_status} />
                    <span className="text-xs text-muted">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.reason ? (
                    <p className="mt-2 text-muted">{entry.reason}</p>
                  ) : (
                    <p className="mt-2 text-muted">{entryMeta.nextSteps}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
