import * as dotenv from "dotenv";
import * as path from "path";
import { isEmailConfigured } from "../src/lib/email/env";
import { sendEmail } from "../src/lib/email/send";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npm run email:test -- you@example.com");
    process.exit(1);
  }

  if (!isEmailConfigured()) {
    console.error("Email is not configured. Set RESEND_API_KEY and EMAIL_FROM in .env");
    process.exit(1);
  }

  const result = await sendEmail({
    to,
    subject: "Jalal's Home Solution — test email",
    text: "If you received this, order notifications are configured correctly.",
    html: "<p>If you received this, order notifications are configured correctly.</p>",
  });

  if (!result.ok) {
    console.error("Failed:", result.error);
    process.exit(1);
  }

  console.log(`Test email sent to ${to}`);
}

main();
