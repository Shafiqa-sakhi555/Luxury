import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminHandoffRow = {
  id: string;
  session_key: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  issue_summary: string;
  status: string;
  created_at: string;
  conversation_snapshot: Array<{ role: string; content: string }>;
};

export async function adminListHandoffs(input: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("assistant_handoff_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    items: (data ?? []) as AdminHandoffRow[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 0,
  };
}

export async function adminUpdateHandoffStatus(id: string, status: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("assistant_handoff_requests")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function adminGetHandoffById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("assistant_handoff_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as AdminHandoffRow | null) ?? null;
}

export async function adminCountPendingHandoffs() {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("assistant_handoff_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");

  if (error) throw new Error(error.message);
  return count ?? 0;
}
