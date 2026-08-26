import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type FinanceDateRange = {
  from?: string;
  to?: string;
};

export async function getFinanceDashboardMetrics(range: FinanceDateRange = {}) {
  const supabase = createSupabaseAdminClient();

  let txnQuery = supabase.from("financial_transactions").select("*");
  if (range.from) txnQuery = txnQuery.gte("transaction_date", range.from);
  if (range.to) txnQuery = txnQuery.lte("transaction_date", `${range.to}T23:59:59.999Z`);
  const { data: transactions } = await txnQuery;

  const rows = transactions ?? [];
  const collected = rows.filter((row) =>
    ["SUCCESSFUL", "PARTIALLY_REFUNDED"].includes(row.payment_status)
  );
  const grossMinor = collected.reduce((sum, row) => sum + (row.amount_minor ?? 0), 0);
  const refundMinor = rows.reduce((sum, row) => sum + (row.refund_amount_minor ?? 0), 0);
  const feeMinor = collected.reduce((sum, row) => sum + (row.gateway_fee_minor ?? 0), 0);
  const taxMinor = collected.reduce((sum, row) => sum + (row.tax_minor ?? 0), 0);
  const netMinor = collected.reduce((sum, row) => sum + (row.net_amount_minor ?? 0), 0);
  const successfulMinor = rows
    .filter((row) => row.payment_status === "SUCCESSFUL")
    .reduce((sum, row) => sum + (row.net_amount_minor ?? 0), 0);
  const failedCount = rows.filter((row) => row.payment_status === "FAILED").length;
  const pendingCount = rows.filter((row) => row.payment_status === "PENDING").length;

  const { count: pendingRefunds } = await supabase
    .from("refund_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING_FINANCE");

  let settlementQuery = supabase.from("finance_settlements").select("net_amount_minor, status");
  if (range.from) settlementQuery = settlementQuery.gte("period_start", range.from);
  if (range.to) settlementQuery = settlementQuery.lte("period_end", range.to);
  const { data: settlements } = await settlementQuery;
  const payoutMinor = (settlements ?? [])
    .filter((row) => row.status === "COMPLETED")
    .reduce((sum, row) => sum + (row.net_amount_minor ?? 0), 0);

  const { data: unreconciled } = await supabase
    .from("finance_reconciliation_records")
    .select("difference_minor")
    .in("status", ["UNRECONCILED", "PARTIALLY_RECONCILED", "DISPUTED"]);

  const outstandingMinor = (unreconciled ?? []).reduce(
    (sum, row) => sum + Math.abs(row.difference_minor ?? 0),
    0
  );

  const dailyMap = new Map<string, { gross: number; net: number; refunds: number }>();
  for (const row of collected) {
    const day = new Date(row.transaction_date).toISOString().slice(0, 10);
    const current = dailyMap.get(day) ?? { gross: 0, net: 0, refunds: 0 };
    current.gross += row.amount_minor ?? 0;
    current.net += row.net_amount_minor ?? 0;
    dailyMap.set(day, current);
  }
  for (const row of rows) {
    if (!(row.refund_amount_minor > 0)) continue;
    const day = new Date(row.transaction_date).toISOString().slice(0, 10);
    const current = dailyMap.get(day) ?? { gross: 0, net: 0, refunds: 0 };
    current.refunds += row.refund_amount_minor ?? 0;
    dailyMap.set(day, current);
  }

  const salesSeries = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, values]) => ({ date, ...values }));

  return {
    grossMinor,
    netMinor,
    refundMinor,
    feeMinor,
    taxMinor,
    payoutMinor,
    successfulMinor,
    failedCount,
    pendingCount,
    pendingRefunds: pendingRefunds ?? 0,
    outstandingMinor,
    salesSeries,
    paymentStatusBreakdown: {
      successful: rows.filter((row) => row.payment_status === "SUCCESSFUL").length,
      pending: rows.filter((row) => row.payment_status === "PENDING").length,
      failed: rows.filter((row) => row.payment_status === "FAILED").length,
      refunded: rows.filter((row) =>
        ["REFUNDED", "PARTIALLY_REFUNDED"].includes(row.payment_status)
      ).length,
    },
  };
}
