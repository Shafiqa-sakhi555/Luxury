import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";

export default async function AdminCustomersPage() {
  const supabase = createSupabaseAdminClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*, profiles(name, email), orders(count)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <AdminPageHeader title="Customers" description="Customer profiles and order history" />
      <AdminCard className="overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="border-b border-navy/10 bg-[#FAFBFD] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Orders</th>
            </tr>
          </thead>
          <tbody>
            {!customers || customers.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-muted">No customers yet.</td></tr>
            ) : (
              customers.map((c: any) => (
                <tr key={c.id} className="border-b border-navy/5">
                  <td className="px-4 py-3">{c.profiles?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.profiles?.email}</td>
                  <td className="px-4 py-3 tabular-nums">{c.orders?.[0]?.count ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
