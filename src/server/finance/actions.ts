"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { writeAuditLog } from "@/server/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRemainingRefundableMinor } from "@/server/finance/queries";
import { ensureFinancialRecordsForOrder } from "@/server/finance/sync";
import { notifyFinanceRefundPending, notifyRefundProcessed } from "@/server/finance/notifications";
import { isEmailConfigured } from "@/lib/email/env";
import { sendEmail } from "@/lib/email/send";
import { formatMoney } from "@/lib/money";
import { getInvoiceById } from "@/server/finance/queries";

function refundNumber() {
  return `RFN-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function createRefundRequestAction(input: {
  orderId: string;
  amountMinor: number;
  reason: string;
  returnStatus?: string;
  adminNotes?: string;
}) {
  try {
    const user = await requirePermission("refunds.create");
    const supabase = createSupabaseAdminClient();

    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_id, total_minor, status, payment_method")
      .eq("id", input.orderId)
      .maybeSingle();

    if (!order) return { ok: false as const, error: "Order not found." };
    if (!["DELIVERED", "SHIPPED", "CANCELLED"].includes(order.status)) {
      return {
        ok: false as const,
        error: "Refund requests are only available after fulfilment review.",
      };
    }

    await ensureFinancialRecordsForOrder(order.id);
    const remaining = await getRemainingRefundableMinor(order.id);
    if (input.amountMinor <= 0 || input.amountMinor > remaining) {
      return {
        ok: false as const,
        error: `Refund amount exceeds remaining refundable balance (${remaining / 100} PKR).`,
      };
    }

    const { data: txn } = await supabase
      .from("financial_transactions")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();

    const { data: pending } = await supabase
      .from("refund_requests")
      .select("id")
      .eq("order_id", order.id)
      .in("status", ["PENDING_ADMIN", "PENDING_FINANCE", "APPROVED", "PROCESSING"])
      .maybeSingle();

    if (pending) {
      return { ok: false as const, error: "An open refund request already exists for this order." };
    }

    const { data: refund, error } = await supabase
      .from("refund_requests")
      .insert({
        refund_number: refundNumber(),
        order_id: order.id,
        transaction_id: txn?.id ?? null,
        customer_id: order.customer_id,
        original_amount_minor: order.total_minor,
        requested_amount_minor: input.amountMinor,
        reason: input.reason.trim(),
        return_status: input.returnStatus ?? "RETURN_CONFIRMED",
        status: "PENDING_FINANCE",
        requested_by: user.id,
        reviewed_by_admin: user.id,
        admin_notes: input.adminNotes?.trim() || null,
      })
      .select("id, refund_number")
      .single();

    if (error || !refund) {
      return { ok: false as const, error: error?.message ?? "Could not create refund request." };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "refund.request_created",
      entityType: "RefundRequest",
      entityId: refund.id,
      after: {
        orderId: order.id,
        amountMinor: input.amountMinor,
        status: "PENDING_FINANCE",
      },
    });

    void notifyFinanceRefundPending(refund.id).catch(console.error);

    revalidatePath("/admin/finance/refunds");
    revalidatePath(`/admin/orders/${order.id}`);

    return { ok: true as const, id: refund.id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}

export async function approveRefundRequestAction(input: {
  refundId: string;
  approvedAmountMinor?: number;
  financeNotes?: string;
}) {
  try {
    const user = await requirePermission("refunds.approve");
    const supabase = createSupabaseAdminClient();

    const { data: refund } = await supabase
      .from("refund_requests")
      .select("*")
      .eq("id", input.refundId)
      .maybeSingle();

    if (!refund) return { ok: false as const, error: "Refund request not found." };
    if (refund.status !== "PENDING_FINANCE") {
      return { ok: false as const, error: "Refund is not awaiting finance approval." };
    }

    const approvedAmount = input.approvedAmountMinor ?? refund.requested_amount_minor;
    const remaining = await getRemainingRefundableMinor(refund.order_id);
    if (approvedAmount <= 0 || approvedAmount > remaining) {
      return { ok: false as const, error: "Approved amount exceeds refundable balance." };
    }

    const { data: txn } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("order_id", refund.order_id)
      .maybeSingle();

    if (!txn) return { ok: false as const, error: "Payment transaction not found." };

    const provider = txn.payment_provider ?? "cod";
    let providerResult = "Manual COD refund recorded.";
    let providerReference: string | null = null;

    if (provider !== "cod" && provider !== "manual") {
      return {
        ok: false as const,
        error: "Automatic gateway refunds are not configured for this payment provider.",
      };
    }

    providerReference = `COD-REF-${Date.now()}`;

    const newRefundTotal = (txn.refund_amount_minor ?? 0) + approvedAmount;
    const newNet = Math.max(0, txn.amount_minor - newRefundTotal);
    const newPaymentStatus =
      newRefundTotal >= txn.amount_minor ? "REFUNDED" : "PARTIALLY_REFUNDED";

    await supabase
      .from("financial_transactions")
      .update({
        refund_amount_minor: newRefundTotal,
        net_amount_minor: newNet,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", txn.id);

    await supabase
      .from("orders")
      .update({ payment_status: newPaymentStatus })
      .eq("id", refund.order_id);

    await supabase
      .from("refund_requests")
      .update({
        status: "COMPLETED",
        approved_amount_minor: approvedAmount,
        refunded_amount_minor: approvedAmount,
        reviewed_by_finance: user.id,
        finance_notes: input.financeNotes?.trim() || null,
        provider_reference: providerReference,
        provider_result: providerResult,
        updated_at: new Date().toISOString(),
      })
      .eq("id", refund.id);

    await ensureFinancialRecordsForOrder(refund.order_id);

    await writeAuditLog({
      actorId: user.id,
      action: "refund.approved",
      entityType: "RefundRequest",
      entityId: refund.id,
      before: { status: refund.status, amountMinor: refund.requested_amount_minor },
      after: {
        status: "COMPLETED",
        approvedAmountMinor: approvedAmount,
        providerReference,
      },
      reason: input.financeNotes,
    });

    void notifyRefundProcessed(refund.id, "approved").catch(console.error);

    revalidatePath("/admin/finance/refunds");
    revalidatePath(`/admin/finance/refunds/${refund.id}`);
    revalidatePath("/admin/finance/transactions");

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}

export async function rejectRefundRequestAction(input: {
  refundId: string;
  rejectionReason: string;
}) {
  try {
    const user = await requirePermission("refunds.reject");
    if (!input.rejectionReason.trim()) {
      return { ok: false as const, error: "Rejection reason is required." };
    }

    const supabase = createSupabaseAdminClient();
    const { data: refund } = await supabase
      .from("refund_requests")
      .select("*")
      .eq("id", input.refundId)
      .maybeSingle();

    if (!refund) return { ok: false as const, error: "Refund request not found." };
    if (refund.status !== "PENDING_FINANCE") {
      return { ok: false as const, error: "Refund is not awaiting finance approval." };
    }

    await supabase
      .from("refund_requests")
      .update({
        status: "REJECTED",
        reviewed_by_finance: user.id,
        rejection_reason: input.rejectionReason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", refund.id);

    await writeAuditLog({
      actorId: user.id,
      action: "refund.rejected",
      entityType: "RefundRequest",
      entityId: refund.id,
      before: { status: refund.status },
      after: { status: "REJECTED" },
      reason: input.rejectionReason.trim(),
    });

    void notifyRefundProcessed(refund.id, "rejected").catch(console.error);

    revalidatePath("/admin/finance/refunds");
    revalidatePath(`/admin/finance/refunds/${refund.id}`);

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}

export async function createCodSettlementAction(input: {
  periodStart: string;
  periodEnd: string;
  actualAmountMinor: number;
  settlementReference?: string;
  notes?: string;
}) {
  try {
    const user = await requirePermission("reconciliation.manage");
    const supabase = createSupabaseAdminClient();

    const { data: txns } = await supabase
      .from("financial_transactions")
      .select("net_amount_minor, refund_amount_minor, gateway_fee_minor, payment_status")
      .eq("payment_provider", "cod")
      .gte("transaction_date", input.periodStart)
      .lte("transaction_date", `${input.periodEnd}T23:59:59.999Z`)
      .in("payment_status", ["SUCCESSFUL", "PARTIALLY_REFUNDED", "REFUNDED"]);

    const grossMinor = (txns ?? []).reduce((sum, row) => sum + (row.net_amount_minor ?? 0), 0);
    const refundMinor = (txns ?? []).reduce((sum, row) => sum + (row.refund_amount_minor ?? 0), 0);
    const feeMinor = (txns ?? []).reduce((sum, row) => sum + (row.gateway_fee_minor ?? 0), 0);
    const expectedMinor = grossMinor;
    const differenceMinor = input.actualAmountMinor - expectedMinor;
    const status =
      differenceMinor === 0
        ? "RECONCILED"
        : Math.abs(differenceMinor) <= 10000
          ? "PARTIALLY_RECONCILED"
          : "UNRECONCILED";

    const settlementNumber = `SET-${Date.now().toString().slice(-6)}`;

    const { data: settlement, error } = await supabase
      .from("finance_settlements")
      .insert({
        settlement_number: settlementNumber,
        provider: "cod",
        period_start: input.periodStart,
        period_end: input.periodEnd,
        gross_amount_minor: grossMinor + refundMinor,
        fee_amount_minor: feeMinor,
        refund_amount_minor: refundMinor,
        net_amount_minor: grossMinor,
        status: status === "RECONCILED" ? "COMPLETED" : "PENDING",
        settlement_reference: input.settlementReference ?? null,
        settled_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !settlement) {
      return { ok: false as const, error: error?.message ?? "Could not create settlement." };
    }

    await supabase.from("finance_reconciliation_records").insert({
      settlement_id: settlement.id,
      expected_amount_minor: expectedMinor,
      actual_amount_minor: input.actualAmountMinor,
      difference_minor: differenceMinor,
      status,
      notes: input.notes ?? null,
      reconciled_by: user.id,
      reconciled_at: new Date().toISOString(),
    });

    await writeAuditLog({
      actorId: user.id,
      action: "finance.reconciliation_created",
      entityType: "FinanceSettlement",
      entityId: settlement.id,
      after: { expectedMinor, actualMinor: input.actualAmountMinor, differenceMinor, status },
    });

    revalidatePath("/admin/finance/payouts");
    revalidatePath("/admin/finance/reconciliation");

    return { ok: true as const, id: settlement.id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}

export async function sendInvoiceEmailAction(invoiceId: string) {
  try {
    const user = await requirePermission("invoices.view");
    if (!isEmailConfigured()) {
      return { ok: false as const, error: "Email is not configured." };
    }

    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) return { ok: false as const, error: "Invoice not found." };

    const profile = Array.isArray(invoice.customers?.profiles)
      ? invoice.customers?.profiles[0]
      : invoice.customers?.profiles;
    const email = profile?.email;
    if (!email) return { ok: false as const, error: "Customer email not found." };

    const order = Array.isArray(invoice.orders) ? invoice.orders[0] : invoice.orders;
    const name = profile?.name ?? order?.shipping_name ?? "Customer";

    const html = `
      <p>Hi ${name},</p>
      <p>Please find your invoice <strong>${invoice.invoice_number}</strong> for order <strong>${order?.order_number ?? "—"}</strong>.</p>
      <ul>
        <li>Subtotal: ${formatMoney(invoice.subtotal_minor)}</li>
        <li>Discount: ${formatMoney(invoice.discount_minor)}</li>
        <li>Delivery: ${formatMoney(invoice.delivery_minor)}</li>
        <li>Tax: ${formatMoney(invoice.tax_minor)}</li>
        <li><strong>Total: ${formatMoney(invoice.total_minor)}</strong></li>
      </ul>
      <p>Payment status: ${invoice.payment_status}</p>
    `;

    const result = await sendEmail({
      to: email,
      subject: `Invoice ${invoice.invoice_number}`,
      text: `Invoice ${invoice.invoice_number} — Total ${formatMoney(invoice.total_minor)}`,
      html,
    });

    if (!result.ok) return { ok: false as const, error: result.error };

    await writeAuditLog({
      actorId: user.id,
      action: "invoice.sent",
      entityType: "Invoice",
      entityId: invoice.id,
      after: { email },
    });

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}
