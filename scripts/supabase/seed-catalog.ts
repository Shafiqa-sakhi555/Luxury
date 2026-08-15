/**
 * Seed all catalog categories (curtains, prayer mats, carpets) into Supabase.
 *
 * Usage: npm run supabase:seed-catalog
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const scripts = [
  "seed-curtains.ts",
  "seed-prayer-mats.ts",
  "seed-carpets.ts",
];

for (const script of scripts) {
  console.log(`\n=== Running ${script} ===\n`);
  const result = spawnSync("npx", ["tsx", path.join("scripts/supabase", script)], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll catalog seeds completed successfully.\n");
