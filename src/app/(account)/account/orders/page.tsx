import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export default async function AccountOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let orders: any[] = [];
  if (user) {
    const { data: customer } = await supabase.from("customers").select("id").eq("profile_id", user.id).maybeSingle();
    if (customer) {
      const { data } = await supabase.from("orders").select("*").eq("customer_id", customer.id).order("created_at", { ascending: false });
      orders = data ?? [];
    }
  }

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
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-muted">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums font-medium">{formatMoney(order.total_minor)}</p>
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
