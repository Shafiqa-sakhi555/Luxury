import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
  provider?: string;
  from?: string;
  to?: string;
};

export async function listFinancialTransactions(params: ListParams = {}) {
  const supabase = createSupabaseAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("financial_transactions")
    .select(
      "*, orders(order_number), customers(profiles(name, email))",
      { count: "exact" }
    );

  if (params.status) query = query.eq("payment_status", params.status);
  if (params.paymentMethod) query = query.eq("payment_method", params.paymentMethod);
  if (params.provider) query = query.eq("payment_provider", params.provider);
  if (params.from) query = query.gte("transaction_date", params.from);
  if (params.to) query = query.lte("transaction_date", `${params.to}T23:59:59.999Z`);
  if (params.search) {
    query = query.or(
      `transaction_number.ilike.%${params.search}%,orders.order_number.ilike.%${params.search}%`
    );
  }

  const { data, count, error } = await query
    .order("transaction_date", { ascending: false })
    .range(start, end);

  if (error) throw new Error(error.message);

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function listRefundRequests(params: ListParams = {}) {
  const supabase = createSupabaseAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("refund_requests")
    .select(
      "*, orders(order_number), customers(profiles(name, email)), financial_transactions(transaction_number, payment_method)",
      { count: "exact" }
    );

  if (params.status) query = query.eq("status", params.status);
  if (params.from) query = query.gte("created_at", params.from);
  if (params.to) query = query.lte("created_at", `${params.to}T23:59:59.999Z`);
  if (params.search) {
    query = query.or(
      `refund_number.ilike.%${params.search}%,orders.order_number.ilike.%${params.search}%`
    );
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) throw new Error(error.message);

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getRefundRequestById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("refund_requests")
    .select(
      "*, orders(*, order_items(*)), customers(profiles(name, email, phone)), financial_transactions(*)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listInvoices(params: ListParams = {}) {
  const supabase = createSupabaseAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("invoices")
    .select("*, orders(order_number), customers(profiles(name, email))", { count: "exact" });

  if (params.status) query = query.eq("payment_status", params.status);
  if (params.search) {
    query = query.or(
      `invoice_number.ilike.%${params.search}%,orders.order_number.ilike.%${params.search}%`
    );
  }

  const { data, count, error } = await query
    .order("issued_at", { ascending: false })
    .range(start, end);

  if (error) throw new Error(error.message);

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getInvoiceById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "*, orders(*, order_items(*), shipping_name, shipping_line1, shipping_city, shipping_phone), customers(profiles(name, email, phone))"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listSettlements(params: ListParams = {}) {
  const supabase = createSupabaseAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase.from("finance_settlements").select("*", { count: "exact" });
  if (params.status) query = query.eq("status", params.status);

  const { data, count, error } = await query
    .order("period_end", { ascending: false })
    .range(start, end);

  if (error) throw new Error(error.message);

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function listReconciliationRecords(params: ListParams = {}) {
  const supabase = createSupabaseAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("finance_reconciliation_records")
    .select("*, finance_settlements(settlement_number, provider, period_start, period_end)", {
      count: "exact",
    });

  if (params.status) query = query.eq("status", params.status);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) throw new Error(error.message);

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getRemainingRefundableMinor(orderId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: txn } = await supabase
    .from("financial_transactions")
    .select("amount_minor, refund_amount_minor, payment_status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!txn) return 0;
  if (txn.payment_status === "REFUNDED") return 0;
  return Math.max(0, (txn.amount_minor ?? 0) - (txn.refund_amount_minor ?? 0));
}
