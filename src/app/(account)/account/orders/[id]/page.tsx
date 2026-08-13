import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) notFound();
  const { data: customer } = await supabase.from("customers").select("id").eq("profile_id", user.id).maybeSingle();
  if (!customer) notFound();

  const { id } = await params;
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-muted hover:text-navy">← Orders</Link>
      <h1 className="mt-4 font-display text-3xl text-navy">{order.order_number}</h1>
      <p className="mt-1 text-sm text-muted">Status: {order.status}</p>
      <ul className="mt-8 space-y-3">
        {order.order_items.map((item: any) => (
          <li key={item.id} className="flex justify-between rounded-xl border border-navy/10 bg-white p-4 text-sm">
            <div>
              <p className="font-medium text-navy">{item.product_name}</p>
              <p className="text-xs text-muted">{item.variant_sku} × {item.quantity}</p>
            </div>
            <span className="tabular-nums">{formatMoney(item.line_total_minor)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-right text-lg font-semibold tabular-nums">{formatMoney(order.total_minor)}</p>
    </div>
  );
}
