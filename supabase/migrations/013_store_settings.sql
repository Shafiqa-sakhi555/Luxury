-- Store-wide delivery charges (singleton row id = 1).
-- Amounts are integer paisa (1 PKR = 100).

CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  delivery_fee_minor INTEGER NOT NULL DEFAULT 250000,
  free_delivery_threshold_minor INTEGER NOT NULL DEFAULT 5000000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.store_settings (id, delivery_fee_minor, free_delivery_threshold_minor)
VALUES (1, 250000, 5000000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
