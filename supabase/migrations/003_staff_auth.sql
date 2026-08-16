-- Staff RBAC tables + auth helpers

-- ==========================================
-- RBAC tables
-- ==========================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ==========================================
-- RLS + staff check RPC
-- ==========================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.roles;
CREATE POLICY "Authenticated users can read roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can read own role assignments" ON public.user_roles;
CREATE POLICY "Users can read own role assignments"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.user_is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('Super Admin', 'Admin', 'Finance')
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_is_staff() TO authenticated;
