/**
 * Apply Supabase catalog schema via direct Postgres connection.
 *
 * Add to .env.local (from Supabase Dashboard → Project Settings → Database):
 *   SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
 *
 * Usage: npm run supabase:migrate
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

config({ path: path.join(process.cwd(), ".env.local"), override: true });
config({ path: path.join(process.cwd(), ".env"), override: true });

const POOLER_REGIONS = [
  "ap-northeast-1",
  "ap-south-1",
  "ap-southeast-1",
  "us-east-1",
  "eu-west-1",
  "eu-central-1",
];

function buildConnectionCandidates(rawUrl: string): string[] {
  if (rawUrl.includes("[YOUR-PASSWORD]")) {
    throw new Error(
      [
        "SUPABASE_DB_URL still contains [YOUR-PASSWORD].",
        "Replace it with your database password from:",
        "  Supabase Dashboard → Project Settings → Database → Database password",
      ].join("\n")
    );
  }

  const parsed = new URL(rawUrl);
  const candidates = [rawUrl];

  const directMatch = parsed.hostname.match(/^db\.([^.]+)\.supabase\.co$/);
  if (directMatch) {
    const ref = directMatch[1];
    const password = encodeURIComponent(decodeURIComponent(parsed.password));
    for (const region of POOLER_REGIONS) {
      candidates.push(
        `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres`
      );
      candidates.push(
        `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`
      );
    }
  }

  return [...new Set(candidates)];
}

async function connectAndMigrate(connectionString: string) {
  const migrationsDir = path.join(process.cwd(), "supabase/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`  applying ${file}...`);
      try {
        await client.query(sql);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("already exists") && file.startsWith("001")) {
          console.log(`    ↷ skipped (already applied)`);
          continue;
        }
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error(
      [
        "SUPABASE_DB_URL is not set.",
        "Add your Supabase database connection string to .env.local:",
        "  Dashboard → Project Settings → Database → Connection string (URI)",
        "Or run supabase/migrations/001_catalog_schema.sql in the SQL Editor.",
      ].join("\n")
    );
  }

  const candidates = buildConnectionCandidates(connectionString);
  console.log("Applying catalog schema to Supabase...\n");

  let lastError: unknown;
  for (const candidate of candidates) {
    const host = new URL(candidate).host;
    try {
      console.log(`→ Trying ${host}...`);
      await connectAndMigrate(candidate);
      console.log("\n✓ Migration applied successfully.\n");
      return;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${message}`);
    }
  }

  throw lastError;
}

main().catch((err) => {
  console.error("\n❌ Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
