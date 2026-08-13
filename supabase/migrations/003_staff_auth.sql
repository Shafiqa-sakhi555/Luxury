-- Staff auth helpers: RLS + RPC for middleware role checks

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
