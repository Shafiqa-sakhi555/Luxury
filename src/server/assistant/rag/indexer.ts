import fs from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getKnowledgeRoot,
  listIndexableSources,
  loadAllCategoryKnowledge,
  loadBranchKnowledge,
  loadCompanyKnowledge,
  loadConsultationRules,
  loadDesignKnowledge,
  loadFaqKnowledge,
  loadGlossary,
  loadProductExport,
  loadSupportProcedures,
} from "../knowledge/loader";
import { buildChunkFromJson, buildChunksFromDocument, type KnowledgeChunkInput } from "./chunker";
import { embedText } from "./embeddings";

async function readSourceText(relativePath: string) {
  return fs.readFile(path.join(getKnowledgeRoot(), relativePath), "utf8");
}

export async function collectKnowledgeChunks(): Promise<KnowledgeChunkInput[]> {
  const chunks: KnowledgeChunkInput[] = [];

  const company = await loadCompanyKnowledge();
  chunks.push(
    ...buildChunkFromJson({
      sourceType: "company",
      sourceId: "company/company.json",
      contentType: "overview",
      data: company,
    })
  );

  const faq = await loadFaqKnowledge();
  for (const entry of faq.faqs) {
    chunks.push(
      ...buildChunksFromDocument({
        sourceType: "faq",
        sourceId: entry.id,
        contentType: "faq",
        text: `Question: ${entry.question}\nAnswer: ${entry.answer}\nCategory: ${entry.category}`,
        verified: entry.verified !== false,
      })
    );
  }

  const branches = await loadBranchKnowledge();
  chunks.push(
    ...buildChunkFromJson({
      sourceType: "branch",
      sourceId: "branches/branches.json",
      contentType: "branches",
      data: branches,
    })
  );

  const categories = await loadAllCategoryKnowledge();
  for (const cat of categories) {
    chunks.push(
      ...buildChunkFromJson({
        sourceType: "category",
        sourceId: `products/categories/${cat.slug}.json`,
        contentType: "category",
        data: cat,
      })
    );
  }

  const design = await loadDesignKnowledge();
  chunks.push(
    ...buildChunkFromJson({
      sourceType: "design",
      sourceId: "design/design-knowledge.json",
      contentType: "design",
      data: design,
    })
  );

  const rules = await loadConsultationRules();
  chunks.push(
    ...buildChunkFromJson({
      sourceType: "design",
      sourceId: "design/consultation-rules.json",
      contentType: "consultation-rules",
      data: rules,
    })
  );

  const support = await loadSupportProcedures();
  chunks.push(
    ...buildChunkFromJson({
      sourceType: "support",
      sourceId: "support/procedures.json",
      contentType: "support",
      data: support,
    })
  );

  const glossary = await loadGlossary();
  chunks.push(
    ...buildChunkFromJson({
      sourceType: "glossary",
      sourceId: "glossary/jalal-terminology.json",
      contentType: "glossary",
      data: glossary,
    })
  );

  const productExport = await loadProductExport();
  if (productExport) {
    for (const product of productExport.products.filter((p) => p.is_canonical_category)) {
      chunks.push(
        ...buildChunksFromDocument({
          sourceType: "product",
          sourceId: product.slug,
          contentType: "description",
          text: [
            `Product: ${product.name}`,
            `Category: ${product.category}`,
            product.short_description ?? "",
            product.description ?? "",
            product.fabric ? `Fabric: ${product.fabric}` : "",
            product.design ? `Design: ${product.design}` : "",
            product.size ? `Size: ${product.size}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          metadata: { productId: product.product_id, slug: product.slug },
        })
      );
    }
  }

  const sources = await listIndexableSources();
  for (const source of sources) {
    if (!source.relativePath.endsWith(".md")) continue;
    if (source.relativePath.startsWith("company/") && source.relativePath !== "company/overview.md") {
      // already covered or loaded individually below
    }
    const text = await readSourceText(source.relativePath);
    chunks.push(
      ...buildChunksFromDocument({
        sourceType: source.sourceType,
        sourceId: source.relativePath,
        contentType: "markdown",
        text,
        verified: source.verified,
      })
    );
  }

  return chunks;
}

export async function reindexAssistantKnowledge() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = createSupabaseAdminClient();
  const chunks = await collectKnowledgeChunks();

  await supabase.from("assistant_knowledge_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  let inserted = 0;
  for (const chunk of chunks) {
    const embedding = await embedText(chunk.content);
    const { error } = await supabase.from("assistant_knowledge_chunks").insert({
      source_type: chunk.sourceType,
      source_id: chunk.sourceId,
      content_type: chunk.contentType,
      content: chunk.content,
      metadata: chunk.metadata ?? {},
      verified: chunk.verified ?? true,
      embedding: JSON.stringify(embedding),
    });

    if (error) throw new Error(`Insert failed for ${chunk.sourceId}: ${error.message}`);
    inserted += 1;
  }

  return { inserted, totalChunks: chunks.length };
}
