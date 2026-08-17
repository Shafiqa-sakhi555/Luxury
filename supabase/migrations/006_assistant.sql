-- Jalal Assistance — conversation persistence (Phase 1 schema, optional use)
-- pgvector / RAG chunks deferred to Phase 2

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.assistant_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assistant_sessions_session_key_idx
  ON public.assistant_sessions (session_key);

CREATE TABLE IF NOT EXISTS public.assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assistant_sessions (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tools_used JSONB,
  ollama_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assistant_messages_session_id_idx
  ON public.assistant_messages (session_id, created_at);

DROP TRIGGER IF EXISTS assistant_sessions_updated_at ON public.assistant_sessions;
CREATE TRIGGER assistant_sessions_updated_at
  BEFORE UPDATE ON public.assistant_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.assistant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

-- Service role only for now; customer read via authenticated API in Phase 2
CREATE POLICY "Service role full access assistant_sessions"
  ON public.assistant_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access assistant_messages"
  ON public.assistant_messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
