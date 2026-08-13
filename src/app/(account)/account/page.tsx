import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export default async function AccountPage() {
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
      <h1 className="font-display text-3xl text-navy">Welcome back</h1>
      <p className="mt-2 text-muted">{user?.email}</p>
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
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-muted">{order.status}</p>
                </div>
                <span className="tabular-nums">{formatMoney(order.total_minor)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
