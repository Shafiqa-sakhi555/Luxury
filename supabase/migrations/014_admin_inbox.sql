-- Per-staff inbox cursor for new-order notifications in admin.

CREATE TABLE IF NOT EXISTS public.admin_inbox_state (
  user_id UUID PRIMARY KEY,
  orders_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_inbox_state ENABLE ROW LEVEL SECURITY;
