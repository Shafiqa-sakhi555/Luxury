import { NextResponse } from "next/server";
import { requirePermission } from "@/server/rbac";
import { getFinanceDashboardMetrics } from "@/server/finance/metrics";
import { listFinancialTransactions } from "@/server/finance/queries";
import { formatMoney } from "@/lib/money";

function csvEscape(value: string | number) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  try {
    await requirePermission("financial_reports.export");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const [metrics, transactions] = await Promise.all([
    getFinanceDashboardMetrics({ from, to }),
    listFinancialTransactions({ from, to, pageSize: 1000 }),
  ]);

  const lines: string[] = [];
  lines.push("Financial Report Summary");
  lines.push(`Period,${from ?? "start"} to ${to ?? "now"}`);
  lines.push("");
  lines.push("Metric,Amount");
  lines.push(`Gross Sales,${formatMoney(metrics.grossMinor)}`);
  lines.push(`Net Sales,${formatMoney(metrics.netMinor)}`);
  lines.push(`Payments,${formatMoney(metrics.successfulMinor)}`);
  lines.push(`Refunds,${formatMoney(metrics.refundMinor)}`);
  lines.push(`Fees,${formatMoney(metrics.feeMinor)}`);
  lines.push(`Taxes,${formatMoney(metrics.taxMinor)}`);
  lines.push(`Payouts,${formatMoney(metrics.payoutMinor)}`);
  lines.push(`Failed Payments,${metrics.failedCount}`);
  lines.push(`Pending Refunds,${metrics.pendingRefunds}`);
  lines.push(`Reconciliation Gap,${formatMoney(metrics.outstandingMinor)}`);
  lines.push("");
  lines.push("Transaction ID,Order ID,Amount,Net,Refund,Status,Date");

  for (const txn of transactions.items) {
    const order = Array.isArray(txn.orders) ? txn.orders[0] : txn.orders;
    lines.push(
      [
        csvEscape(txn.transaction_number),
        csvEscape(order?.order_number ?? ""),
        csvEscape(formatMoney(txn.amount_minor)),
        csvEscape(formatMoney(txn.net_amount_minor)),
        csvEscape(formatMoney(txn.refund_amount_minor)),
        csvEscape(txn.payment_status),
        csvEscape(new Date(txn.transaction_date).toISOString().slice(0, 10)),
      ].join(",")
    );
  }

  const filename = `finance-report-${from ?? "all"}-${to ?? "now"}.csv`;

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
