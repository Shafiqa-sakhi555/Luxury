import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { isCloudinaryConfigured } from "../src/lib/cloudinary/env";
import { isEmailConfigured } from "../src/lib/email/env";
import { getPublicSupabaseAnonKey } from "../src/lib/supabase/public-keys";

config({ path: path.join(process.cwd(), ".env.local"), override: true });
config({ path: path.join(process.cwd(), ".env"), override: true });

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const optional = [
  "SUPABASE_DB_URL",
  "CLOUDINARY_CLOUD_NAME",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

function isPlaceholder(value: string | undefined) {
  if (!value) return false;
  return /YOUR_|placeholder|\[YOUR/i.test(value);
}

let ok = true;
let warnings = 0;

console.log("Environment check\n");

const envLocalPath = path.join(process.cwd(), ".env.local");
const envPath = path.join(process.cwd(), ".env");

if (!fs.existsSync(envLocalPath) && !fs.existsSync(envPath)) {
  console.log("✗  No .env.local or .env file found.");
  process.exit(1);
} else if (!fs.existsSync(envLocalPath)) {
  console.log("·  Using .env (no .env.local — that is fine if keys are in .env)");
}

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value || isPlaceholder(value)) {
    console.log(`✗  ${key} is not set`);
    ok = false;
  } else {
    console.log(`✓  ${key} is set`);
  }
}

const publicKey = getPublicSupabaseAnonKey();
if (publicKey && !isPlaceholder(publicKey)) {
  const source = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
  console.log(`✓  Supabase public key is set (${source})`);
} else {
  console.log("✗  Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  ok = false;
}

for (const key of optional) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.log(`·  ${key} is optional (not set)`);
    continue;
  }
  if (isPlaceholder(value)) {
    console.log(`⚠  ${key} is still a placeholder — update before using migrations/tools`);
    warnings += 1;
  } else {
    console.log(`✓  ${key} is set`);
  }
}

console.log("");
console.log("Integrations");
console.log(isCloudinaryConfigured() ? "✓  Cloudinary configured (image uploads)" : "·  Cloudinary not configured");
console.log(isEmailConfigured() ? "✓  Email configured (Resend)" : "·  Email not configured");

console.log("");
if (!ok) {
  console.log("Fix the missing variables, then run: npm run dev:clean");
  process.exit(1);
}

if (warnings > 0) {
  console.log("Required keys are present, but fix placeholder values above when you need DB migrations.");
} else {
  console.log("All required variables are present. Restart npm run dev if you just changed .env.");
}
