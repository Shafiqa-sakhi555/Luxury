import { db } from "@/server/db";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";

export default async function AdminCustomersPage() {
  const customers = await db.customer.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, _count: { select: { orders: true } } },
  }).catch(() => []);

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
            {customers.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-muted">No customers yet.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-navy/5">
                  <td className="px-4 py-3">{c.user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.user.email}</td>
                  <td className="px-4 py-3 tabular-nums">{c._count.orders}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
