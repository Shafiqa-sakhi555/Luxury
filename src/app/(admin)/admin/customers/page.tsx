import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  AdminTableEmpty,
  AdminTableToolbar,
  AdminPagination,
} from "@/components/admin/ui";

const PAGE_SIZE = 25;

function buildCustomersHref(page: number) {
  return page > 1 ? `/admin/customers?page=${page}` : "/admin/customers";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminPageAccess("customer.read");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  const supabase = createSupabaseAdminClient();
  const { data: customers, count } = await supabase
    .from("customers")
    .select("*, profiles(name, email), orders(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(start, end);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminPageHeader title="Customers" description="Customer profiles and order history" />

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">
            {total} customer{total === 1 ? "" : "s"}
          </p>
        </AdminTableToolbar>

        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Customer</AdminTableHead>
              <AdminTableHead>Email</AdminTableHead>
              <AdminTableHead align="right">Orders</AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {!customers || customers.length === 0 ? (
              <AdminTableEmpty
                colSpan={3}
                title="No customers yet"
                description="Registered customers will appear here after they create an account or checkout."
              />
            ) : (
              customers.map((c: {
                id: string;
                profiles?: { name?: string | null; email?: string | null } | null;
                orders?: Array<{ count: number }>;
              }) => (
                <AdminTableRow key={c.id}>
                  <AdminTableCell className="font-medium text-navy">
                    {c.profiles?.name ?? "—"}
                  </AdminTableCell>
                  <AdminTableCell className="text-muted">{c.profiles?.email ?? "—"}</AdminTableCell>
                  <AdminTableCell align="right" className="tabular-nums">
                    {c.orders?.[0]?.count ?? 0}
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTableBody>
        </AdminTable>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          buildHref={buildCustomersHref}
        />
      </AdminCard>
    </div>
  );
}
