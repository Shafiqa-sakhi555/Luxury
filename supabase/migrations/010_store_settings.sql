-- Singleton store settings: delivery fee and free-delivery threshold (paisa)

CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  delivery_fee_minor INTEGER NOT NULL DEFAULT 250000 CHECK (delivery_fee_minor >= 0),
  free_delivery_threshold_minor INTEGER NOT NULL DEFAULT 5000000 CHECK (free_delivery_threshold_minor >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

INSERT INTO public.store_settings (id, delivery_fee_minor, free_delivery_threshold_minor)
VALUES (1, 250000, 5000000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.permissions (key, description) VALUES
  ('settings.write', 'Update store settings such as delivery charges')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Admin'
  AND p.key = 'settings.write'
ON CONFLICT (role_id, permission_id) DO NOTHING;
