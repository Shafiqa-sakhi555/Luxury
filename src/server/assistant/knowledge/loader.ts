import fs from "node:fs/promises";
import path from "node:path";
import type {
  BranchKnowledge,
  CategoryKnowledge,
  CompanyKnowledge,
  FaqKnowledge,
  ProductExportManifest,
} from "./types";

const KNOWLEDGE_ROOT = path.join(process.cwd(), "jalal-ai-knowledge");

async function readJson<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(KNOWLEDGE_ROOT, relativePath);
  const raw = await fs.readFile(fullPath, "utf8");
  return JSON.parse(raw) as T;
}

async function readText(relativePath: string): Promise<string> {
  const fullPath = path.join(KNOWLEDGE_ROOT, relativePath);
  return fs.readFile(fullPath, "utf8");
}

export function getKnowledgeRoot() {
  return KNOWLEDGE_ROOT;
}

export async function loadCompanyKnowledge(): Promise<CompanyKnowledge> {
  return readJson<CompanyKnowledge>("company/company.json");
}

export async function loadBranchKnowledge(): Promise<BranchKnowledge> {
  return readJson<BranchKnowledge>("branches/branches.json");
}

export async function loadFaqKnowledge(): Promise<FaqKnowledge> {
  return readJson<FaqKnowledge>("faq/faq.json");
}

export async function loadCategoryKnowledge(slug: string): Promise<CategoryKnowledge | null> {
  try {
    return await readJson<CategoryKnowledge>(`products/categories/${slug}.json`);
  } catch {
    return null;
  }
}

export async function loadAllCategoryKnowledge(): Promise<CategoryKnowledge[]> {
  const dir = path.join(KNOWLEDGE_ROOT, "products/categories");
  const files = await fs.readdir(dir);
  const categories = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map((f) => readJson<CategoryKnowledge>(`products/categories/${f}`))
  );
  return categories;
}

export async function loadProductExport(): Promise<ProductExportManifest | null> {
  try {
    return await readJson<ProductExportManifest>("products/export/products.json");
  } catch {
    return null;
  }
}

export async function loadPolicyMarkdown(slug: string): Promise<string | null> {
  try {
    return await readText(`policies/${slug}.md`);
  } catch {
    return null;
  }
}

export async function loadDesignKnowledge() {
  return readJson("design/design-knowledge.json");
}

export async function loadConsultationRules() {
  return readJson("design/consultation-rules.json");
}

export async function loadConsultationQuestions() {
  return readJson("design/consultation-questions.json");
}

export async function loadSupportProcedures() {
  return readJson("support/procedures.json");
}

export async function loadGlossary() {
  return readJson("glossary/jalal-terminology.json");
}

export async function loadOrderStatusDefinitions() {
  return readJson("orders/status-definitions.json");
}

/** List markdown + json files suitable for RAG indexing (Phase 2) */
export async function listIndexableSources(): Promise<
  Array<{ relativePath: string; sourceType: string; verified: boolean }>
> {
  const entries: Array<{ relativePath: string; sourceType: string; verified: boolean }> = [];

  const pushDir = async (subdir: string, sourceType: string, ext: string) => {
    const dir = path.join(KNOWLEDGE_ROOT, subdir);
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const f of files) {
        if (f.isFile() && f.name.endsWith(ext)) {
          entries.push({
            relativePath: `${subdir}/${f.name}`,
            sourceType,
            verified: !f.name.includes("placeholder"),
          });
        }
      }
    } catch {
      /* directory may not exist yet */
    }
  };

  await pushDir("company", "company", ".md");
  await pushDir("policies", "policy", ".md");
  await pushDir("visualization", "design", ".md");
  await pushDir("products/categories", "category", ".json");
  await pushDir("design", "design", ".json");
  await pushDir("support", "support", ".json");
  await pushDir("glossary", "glossary", ".json");
  await pushDir("orders", "order", ".json");
  await pushDir("faq", "faq", ".json");
  await pushDir("branches", "branch", ".json");

  const productExport = path.join(KNOWLEDGE_ROOT, "products/export/products.json");
  try {
    await fs.access(productExport);
    entries.push({
      relativePath: "products/export/products.json",
      sourceType: "product",
      verified: true,
    });
  } catch {
    /* not exported yet */
  }

  return entries;
}

/** Guardrail helper — refuse to answer from unverified company fields */
export function isCompanyFieldVerified(
  field: keyof CompanyKnowledge,
  company: CompanyKnowledge
): boolean {
  if (company.verified === false) return false;
  const value = company[field];
  if (value === "" || (Array.isArray(value) && value.length === 0)) return false;
  return true;
}
