import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

config({ path: path.join(process.cwd(), ".env.local"), override: true });
config({ path: path.join(process.cwd(), ".env"), override: true });

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const optional = ["SUPABASE_DB_URL", "CLOUDINARY_CLOUD_NAME"] as const;

let ok = true;

console.log("Environment check\n");

const envLocalPath = path.join(process.cwd(), ".env.local");
const envPath = path.join(process.cwd(), ".env");

if (!fs.existsSync(envLocalPath) && !fs.existsSync(envPath)) {
  console.log("⚠  No .env.local or .env file found.");
  ok = false;
} else if (!fs.existsSync(envLocalPath)) {
  console.log("·  Using .env (no .env.local — that is fine if keys are in .env)");
}

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.log(`✗  ${key} is not set`);
    ok = false;
  } else {
    console.log(`✓  ${key} is set`);
  }
}

for (const key of optional) {
  const value = process.env[key]?.trim();
  console.log(value ? `✓  ${key} is set` : `·  ${key} is optional (not set)`);
}

console.log("");
if (ok) {
  console.log("All required Supabase variables are present. Restart npm run dev if you just added them.");
} else {
  console.log("Fix the missing variables, then run: npm run dev:clean");
  process.exit(1);
}
