-- Jalal Assistance Phase 3 — human handoff requests

CREATE TABLE IF NOT EXISTS public.assistant_handoff_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.assistant_sessions (id) ON DELETE SET NULL,
  session_key TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  issue_summary TEXT NOT NULL,
  conversation_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assistant_handoff_requests_status_idx
  ON public.assistant_handoff_requests (status, created_at DESC);

DROP TRIGGER IF EXISTS assistant_handoff_requests_updated_at ON public.assistant_handoff_requests;
CREATE TRIGGER assistant_handoff_requests_updated_at
  BEFORE UPDATE ON public.assistant_handoff_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.assistant_handoff_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access assistant_handoff_requests"
  ON public.assistant_handoff_requests;
CREATE POLICY "Service role full access assistant_handoff_requests"
  ON public.assistant_handoff_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
