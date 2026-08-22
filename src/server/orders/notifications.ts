import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getExtraStaffEmails, getSiteUrl, isEmailConfigured } from "@/lib/email/env";
import { sendEmail } from "@/lib/email/send";
import { formatMoney } from "@/lib/money";
import { customerOrderStatusLabel, getOrderStatusMeta } from "@/lib/orders/status";

const STAFF_NOTIFY_ROLES = ["Super Admin", "Admin", "Finance"] as const;

type OrderEmailContext = {
  id: string;
  order_number: string;
  status: string;
  total_minor: number;
  shipping_name: string | null;
  shipping_line1: string | null;
  shipping_city: string | null;
  shipping_phone: string | null;
  customerName: string;
  customerEmail: string | null;
  itemSummary: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmailHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f8f5f2;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#d71920;">Jalal's Home Solution</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#1f2937;">${escapeHtml(title)}</h1>
      ${body}
      <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">Jalal's Home Solution · Gilgit-Baltistan, Pakistan</p>
    </div>
  </body>
</html>`;
}

async function loadOrderEmailContext(orderId: string): Promise<OrderEmailContext | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total_minor, shipping_name, shipping_line1, shipping_city, shipping_phone, order_items(product_name, quantity), customers(profiles(name, email))")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    console.error("loadOrderEmailContext failed:", error?.message ?? "Order not found");
    return null;
  }

  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
  const profile = Array.isArray(customer?.profiles) ? customer?.profiles[0] : customer?.profiles;

  const items = (data.order_items ?? []) as Array<{ product_name: string; quantity: number }>;
  const itemSummary =
    items.length === 0
      ? "Items unavailable"
      : items.map((item) => `${item.product_name} × ${item.quantity}`).join(", ");

  return {
    id: data.id,
    order_number: data.order_number,
    status: data.status,
    total_minor: data.total_minor,
    shipping_name: data.shipping_name,
    shipping_line1: data.shipping_line1,
    shipping_city: data.shipping_city,
    shipping_phone: data.shipping_phone,
    customerName: profile?.name ?? data.shipping_name ?? "Customer",
    customerEmail: profile?.email ?? null,
    itemSummary,
  };
}

export async function listOrderNotificationStaffEmails(): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  const { data: roles } = await supabase
    .from("roles")
    .select("id, name")
    .in("name", [...STAFF_NOTIFY_ROLES]);

  const roleIds = (roles ?? []).map((role) => role.id);
  if (roleIds.length === 0) {
    return getExtraStaffEmails();
  }

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role_id", roleIds);

  const userIds = [...new Set((userRoles ?? []).map((row) => row.user_id))];
  if (userIds.length === 0) {
    return getExtraStaffEmails();
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("email")
    .in("id", userIds)
    .eq("is_active", true);

  const emails = new Set<string>();
  for (const profile of profiles ?? []) {
    if (profile.email) emails.add(profile.email.trim().toLowerCase());
  }
  for (const extra of getExtraStaffEmails()) {
    emails.add(extra);
  }

  return [...emails];
}

async function notifyStaff(subject: string, html: string, text: string) {
  const recipients = await listOrderNotificationStaffEmails();
  if (recipients.length === 0) {
    console.warn("No staff notification emails configured.");
    return;
  }

  const result = await sendEmail({ to: recipients, subject, html, text });
  if (!result.ok) {
    console.error("Staff notification email failed:", result.error);
  }
}

async function notifyCustomer(to: string, subject: string, html: string, text: string) {
  const result = await sendEmail({ to, subject, html, text });
  if (!result.ok) {
    console.error("Customer notification email failed:", result.error);
  }
}

function orderDetailsBlock(order: OrderEmailContext): string {
  return `<p style="margin:0 0 12px;"><strong>Order:</strong> ${escapeHtml(order.order_number)}</p>
<p style="margin:0 0 12px;"><strong>Total:</strong> ${escapeHtml(formatMoney(order.total_minor))}</p>
<p style="margin:0 0 12px;"><strong>Items:</strong> ${escapeHtml(order.itemSummary)}</p>
<p style="margin:0 0 12px;"><strong>Delivery:</strong> ${escapeHtml(order.shipping_name ?? "—")}, ${escapeHtml(order.shipping_line1 ?? "—")}, ${escapeHtml(order.shipping_city ?? "—")}</p>`;
}

export async function sendNewOrderStaffNotifications(orderId: string) {
  if (!isEmailConfigured()) return;

  const order = await loadOrderEmailContext(orderId);
  if (!order) return;

  const adminUrl = `${getSiteUrl()}/admin/orders/${order.id}`;
  const subject = `New order ${order.order_number} — review required`;
  const text = `A new order was placed.\n\nOrder: ${order.order_number}\nCustomer: ${order.customerName}\nTotal: ${formatMoney(order.total_minor)}\n\nReview: ${adminUrl}`;
  const html = wrapEmailHtml(
    "New order received",
    `<p style="margin:0 0 16px;">A customer placed a new order that is awaiting review.</p>
${orderDetailsBlock(order)}
<p style="margin:0 0 12px;"><strong>Customer:</strong> ${escapeHtml(order.customerName)}${order.customerEmail ? ` (${escapeHtml(order.customerEmail)})` : ""}</p>
<p style="margin:16px 0 0;"><a href="${adminUrl}" style="display:inline-block;background:#1f2937;color:#ffffff;padding:12px 18px;border-radius:999px;text-decoration:none;font-size:14px;">Review in admin</a></p>`
  );

  await notifyStaff(subject, html, text);
}

export async function sendOrderStatusChangeNotifications(
  orderId: string,
  previousStatus: string,
  newStatus: string,
  reason?: string
) {
  if (!isEmailConfigured()) return;
  if (previousStatus === newStatus) return;

  const order = await loadOrderEmailContext(orderId);
  if (!order) return;

  const statusMeta = getOrderStatusMeta(newStatus);
  const accountUrl = `${getSiteUrl()}/account/orders/${order.id}`;
  const adminUrl = `${getSiteUrl()}/admin/orders/${order.id}`;

  if (newStatus === "CONFIRMED" || newStatus === "SHIPPED") {
    if (order.customerEmail) {
      const customerSubject =
        newStatus === "CONFIRMED"
          ? `Your order ${order.order_number} is confirmed`
          : `Your order ${order.order_number} has shipped`;

      const customerText = `Hi ${order.customerName},

Your order ${order.order_number} is now ${customerOrderStatusLabel(newStatus).toLowerCase()}.

${statusMeta.meaning}
${statusMeta.nextSteps}
${reason ? `\nNote: ${reason}` : ""}

Track your order: ${accountUrl}

Thank you for shopping with Jalal's Home Solution.`;

      const customerHtml = wrapEmailHtml(
        customerOrderStatusLabel(newStatus),
        `<p style="margin:0 0 16px;">Hi ${escapeHtml(order.customerName)},</p>
<p style="margin:0 0 16px;">Your order <strong>${escapeHtml(order.order_number)}</strong> is now <strong>${escapeHtml(customerOrderStatusLabel(newStatus))}</strong>.</p>
<p style="margin:0 0 12px;">${escapeHtml(statusMeta.meaning)}</p>
<p style="margin:0 0 12px;">${escapeHtml(statusMeta.nextSteps)}</p>
${reason ? `<p style="margin:0 0 12px;"><strong>Note:</strong> ${escapeHtml(reason)}</p>` : ""}
${orderDetailsBlock(order)}
<p style="margin:16px 0 0;"><a href="${accountUrl}" style="display:inline-block;background:#1f2937;color:#ffffff;padding:12px 18px;border-radius:999px;text-decoration:none;font-size:14px;">View your order</a></p>`
      );

      await notifyCustomer(order.customerEmail, customerSubject, customerHtml, customerText);
    } else {
      console.warn(`Order ${order.order_number} has no customer email for status notification.`);
    }

    const staffSubject = `Order ${order.order_number} — ${customerOrderStatusLabel(newStatus)}`;
    const staffText = `Order ${order.order_number} changed from ${previousStatus} to ${newStatus}.

Customer: ${order.customerName}
Total: ${formatMoney(order.total_minor)}
${reason ? `Note: ${reason}` : ""}

Admin: ${adminUrl}`;

    const staffHtml = wrapEmailHtml(
      `Order ${customerOrderStatusLabel(newStatus)}`,
      `<p style="margin:0 0 16px;">Order status updated for staff follow-up.</p>
<p style="margin:0 0 12px;"><strong>Status:</strong> ${escapeHtml(previousStatus)} → ${escapeHtml(newStatus)}</p>
${reason ? `<p style="margin:0 0 12px;"><strong>Note:</strong> ${escapeHtml(reason)}</p>` : ""}
${orderDetailsBlock(order)}
<p style="margin:0 0 12px;"><strong>Customer:</strong> ${escapeHtml(order.customerName)}${order.customerEmail ? ` (${escapeHtml(order.customerEmail)})` : ""}</p>
<p style="margin:16px 0 0;"><a href="${adminUrl}" style="display:inline-block;background:#1f2937;color:#ffffff;padding:12px 18px;border-radius:999px;text-decoration:none;font-size:14px;">Open in admin</a></p>`
    );

    await notifyStaff(staffSubject, staffHtml, staffText);
  }
}
