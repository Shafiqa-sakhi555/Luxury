import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isEmailConfigured } from "@/lib/email/env";
import { sendEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/email/env";
import { formatMoney } from "@/lib/money";
import { listOrderNotificationStaffEmails } from "@/server/orders/notifications";

async function getRefundEmailContext(refundId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("refund_requests")
    .select(
      "refund_number, requested_amount_minor, approved_amount_minor, status, rejection_reason, orders(order_number), customers(profiles(name, email))"
    )
    .eq("id", refundId)
    .maybeSingle();

  if (!data) return null;
  const customerJoin = data.customers as
    | { profiles?: { name?: string | null; email?: string | null } | { name?: string | null; email?: string | null }[] | null }
    | { profiles?: { name?: string | null; email?: string | null } | { name?: string | null; email?: string | null }[] | null }[]
    | null;
  const customer = Array.isArray(customerJoin) ? customerJoin[0] : customerJoin;
  const profile = Array.isArray(customer?.profiles) ? customer?.profiles[0] : customer?.profiles;
  const order = Array.isArray(data.orders) ? data.orders[0] : data.orders;

  return {
    refundNumber: data.refund_number,
    orderNumber: order?.order_number ?? "—",
    amountMinor: data.approved_amount_minor ?? data.requested_amount_minor,
    status: data.status,
    rejectionReason: data.rejection_reason,
    customerName: profile?.name ?? "Customer",
    customerEmail: profile?.email ?? null,
  };
}

export async function notifyFinanceRefundPending(refundId: string) {
  if (!isEmailConfigured()) return;

  const context = await getRefundEmailContext(refundId);
  if (!context) return;

  const staff = await listOrderNotificationStaffEmails();
  if (staff.length === 0) return;

  const url = `${getSiteUrl()}/admin/finance/refunds/${refundId}`;
  await sendEmail({
    to: staff,
    subject: `Refund approval required — ${context.refundNumber}`,
    text: `Refund ${context.refundNumber} for order ${context.orderNumber} requires finance approval.\nAmount: ${formatMoney(context.amountMinor)}\nReview: ${url}`,
    html: `<p>Refund <strong>${context.refundNumber}</strong> for order <strong>${context.orderNumber}</strong> requires finance approval.</p><p>Amount: ${formatMoney(context.amountMinor)}</p><p><a href="${url}">Review refund</a></p>`,
  });
}

export async function notifyRefundProcessed(refundId: string, outcome: "approved" | "rejected") {
  if (!isEmailConfigured()) return;

  const context = await getRefundEmailContext(refundId);
  if (!context?.customerEmail) return;

  const subject =
    outcome === "approved"
      ? `Refund processed for order ${context.orderNumber}`
      : `Refund request update for order ${context.orderNumber}`;

  const body =
    outcome === "approved"
      ? `Hi ${context.customerName}, your refund of ${formatMoney(context.amountMinor)} for order ${context.orderNumber} has been processed.`
      : `Hi ${context.customerName}, your refund request for order ${context.orderNumber} was not approved.${context.rejectionReason ? ` Reason: ${context.rejectionReason}` : ""}`;

  await sendEmail({
    to: context.customerEmail,
    subject,
    text: body,
    html: `<p>${body}</p>`,
  });
}
