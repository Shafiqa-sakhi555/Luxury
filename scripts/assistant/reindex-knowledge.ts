/**
 * Index jalal-ai-knowledge into pgvector for RAG retrieval.
 *
 * Prerequisites:
 *   1. npm run supabase:migrate  (007_assistant_rag.sql)
 *   2. ollama pull nomic-embed-text
 *   3. ollama serve
 *
 * Usage: npm run assistant:reindex
 */
import "dotenv/config";
import { config } from "dotenv";
import path from "node:path";
import { reindexAssistantKnowledge } from "../../src/server/assistant/rag/indexer";

config({ path: path.join(process.cwd(), ".env.local"), override: true });

async function main() {
  console.log("Indexing Jalal knowledge base into pgvector...\n");
  const result = await reindexAssistantKnowledge();
  console.log(`\nDone. Inserted ${result.inserted} chunks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
