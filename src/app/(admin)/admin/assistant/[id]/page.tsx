import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { adminGetHandoffById } from "@/server/assistant/handoffs-admin";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { HandoffStatusForm } from "@/components/admin/assistant/HandoffStatusForm";
import { HandoffStatusBadge } from "@/components/admin/ui";

function contactLabel(handoff: {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}) {
  return handoff.contact_name ?? handoff.contact_email ?? handoff.contact_phone ?? "Anonymous visitor";
}

export default async function AdminHandoffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPageAccess("customer.read");
  const { id } = await params;
  const handoff = await adminGetHandoffById(id).catch(() => null);

  if (!handoff) notFound();

  const messages = handoff.conversation_snapshot ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Handoff request"
        description={`Received ${new Date(handoff.created_at).toLocaleString()}`}
        actions={
          <Link href="/admin/assistant" className="text-sm text-navy hover:underline">
            Back to assistant queue
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <AdminCard className="p-5">
            <h2 className="text-sm font-semibold text-navy">Issue summary</h2>
            <p className="mt-3 text-sm leading-relaxed text-navy">{handoff.issue_summary}</p>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <div className="border-b border-navy/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-navy">Conversation snapshot</h2>
              <p className="mt-1 text-xs text-muted">
                Last {messages.length} message{messages.length !== 1 ? "s" : ""} from the chat session
              </p>
            </div>
            <div className="space-y-3 p-5">
              {messages.length === 0 ? (
                <p className="text-sm text-muted">No messages were captured for this handoff.</p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "ml-8 bg-navy/5 text-navy"
                        : "mr-8 border border-navy/10 bg-white text-navy"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {message.role === "user" ? "Customer" : "Assistant"}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </AdminCard>
        </div>

        <aside className="space-y-6">
          <AdminCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-navy">Status</h2>
              <HandoffStatusBadge status={handoff.status} />
            </div>
            <div className="mt-4">
              <HandoffStatusForm handoffId={handoff.id} currentStatus={handoff.status} />
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <h2 className="text-sm font-semibold text-navy">Contact</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
                <dd className="mt-0.5 text-navy">{contactLabel(handoff)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
                <dd className="mt-0.5 text-navy">
                  {handoff.contact_email ? (
                    <a href={`mailto:${handoff.contact_email}`} className="hover:underline">
                      {handoff.contact_email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Phone</dt>
                <dd className="mt-0.5 text-navy">
                  {handoff.contact_phone ? (
                    <a href={`tel:${handoff.contact_phone}`} className="hover:underline">
                      {handoff.contact_phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Session</dt>
                <dd className="mt-0.5 font-mono text-xs text-muted">{handoff.session_key.slice(0, 12)}…</dd>
              </div>
            </dl>
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
