export const FINANCE_VIEW_PERMISSIONS = [
  "finance.read",
  "finance.dashboard.view",
  "transactions.view",
  "payments.view",
] as const;

export const FINANCE_NAV_ITEMS = [
  { href: "/admin/finance", label: "Finance Dashboard", permissions: ["finance.read", "finance.dashboard.view"] },
  { href: "/admin/finance/transactions", label: "Transactions", permissions: ["transactions.view", "payments.view", "finance.read"] },
  { href: "/admin/finance/refunds", label: "Refunds", permissions: ["refunds.view", "finance.read"] },
  { href: "/admin/finance/invoices", label: "Invoices", permissions: ["invoices.view", "finance.read"] },
  { href: "/admin/finance/payouts", label: "Payouts", permissions: ["payouts.view", "settlements.view", "finance.read"] },
  { href: "/admin/finance/reconciliation", label: "Reconciliation", permissions: ["reconciliation.view", "finance.read"] },
  { href: "/admin/finance/reports", label: "Financial Reports", permissions: ["financial_reports.view", "finance.read"] },
] as const;

export function canViewFinance(permissions: Set<string>) {
  if (permissions.has("*")) return true;
  return FINANCE_VIEW_PERMISSIONS.some((key) => permissions.has(key));
}

export function canApproveRefunds(permissions: Set<string>) {
  return permissions.has("*") || permissions.has("refunds.approve");
}

export function canCreateRefunds(permissions: Set<string>) {
  return permissions.has("*") || permissions.has("refunds.create");
}

export function canExportReports(permissions: Set<string>) {
  return permissions.has("*") || permissions.has("financial_reports.export");
}

export function canManageReconciliation(permissions: Set<string>) {
  return permissions.has("*") || permissions.has("reconciliation.manage");
}
