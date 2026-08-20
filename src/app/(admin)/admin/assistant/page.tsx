import Link from "next/link";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { adminListHandoffs } from "@/server/assistant/handoffs-admin";
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
  HandoffStatusBadge,
  AdminFilterPills,
  handoffStatusFilterItems,
} from "@/components/admin/ui";

function buildHandoffsHref(page: number, status?: string) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/admin/assistant?${qs}` : "/admin/assistant";
}

function contactLabel(row: {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}) {
  return row.contact_name ?? row.contact_email ?? row.contact_phone ?? "Anonymous visitor";
}

export default async function AdminAssistantHandoffsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const status = params.status;

  await requireAdminPageAccess("customer.read");
  const result = await adminListHandoffs({ page, status }).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    totalPages: 0,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Jalal Assistance"
        description="Human handoff requests from the storefront chatbot"
      />

      <AdminCard className="mb-4 p-4">
        <AdminFilterPills items={handoffStatusFilterItems(status)} activeValue={status} />
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">
            {result.total} request{result.total !== 1 ? "s" : ""}
          </p>
        </AdminTableToolbar>

        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Customer</AdminTableHead>
              <AdminTableHead>Issue</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
              <AdminTableHead>Received</AdminTableHead>
              <AdminTableHead align="right"> </AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {result.items.length === 0 ? (
              <AdminTableEmpty
                colSpan={5}
                title="No handoff requests"
                description={
                  status
                    ? "No requests match this filter."
                    : "When customers ask to speak with someone, tickets appear here."
                }
              />
            ) : (
              result.items.map((row) => (
                <AdminTableRow key={row.id}>
                  <AdminTableCell>
                    <Link
                      href={`/admin/assistant/${row.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {contactLabel(row)}
                    </Link>
                    <p className="text-xs text-muted">
                      {[row.contact_email, row.contact_phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </AdminTableCell>
                  <AdminTableCell className="max-w-xs">
                    <p className="line-clamp-2 text-sm text-navy">{row.issue_summary}</p>
                    {row.conversation_snapshot?.length ? (
                      <p className="mt-1 text-[11px] text-muted">
                        {row.conversation_snapshot.length} message
                        {row.conversation_snapshot.length !== 1 ? "s" : ""} captured
                      </p>
                    ) : null}
                  </AdminTableCell>
                  <AdminTableCell>
                    <HandoffStatusBadge status={row.status} />
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-muted">
                    {new Date(row.created_at).toLocaleString()}
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <Link
                      href={`/admin/assistant/${row.id}`}
                      className="text-sm font-medium text-navy hover:underline"
                    >
                      View
                    </Link>
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTableBody>
        </AdminTable>

        <AdminPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          buildHref={(p) => buildHandoffsHref(p, status)}
        />
      </AdminCard>
    </div>
  );
}
