-- Jalal Assistance Phase 2 — pgvector RAG knowledge chunks

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.assistant_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(768),
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assistant_knowledge_chunks_source_idx
  ON public.assistant_knowledge_chunks (source_type, source_id);

CREATE INDEX IF NOT EXISTS assistant_knowledge_chunks_embedding_idx
  ON public.assistant_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

DROP TRIGGER IF EXISTS assistant_knowledge_chunks_updated_at ON public.assistant_knowledge_chunks;
CREATE TRIGGER assistant_knowledge_chunks_updated_at
  BEFORE UPDATE ON public.assistant_knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.assistant_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access assistant_knowledge_chunks"
  ON public.assistant_knowledge_chunks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Similarity search helper (cosine distance)
CREATE OR REPLACE FUNCTION public.match_assistant_knowledge(
  query_embedding vector(768),
  match_count INT DEFAULT 5,
  min_similarity FLOAT DEFAULT 0.45
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.source_type,
    c.source_id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.assistant_knowledge_chunks c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) >= min_similarity
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
