export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export function getResendApiKey(): string {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  return key;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || "Jalal's Home Solution <orders@jalalsgroup.com>";
}

export function getEmailReplyTo(): string | undefined {
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  return replyTo || undefined;
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

/** Optional comma-separated extra staff inboxes (e.g. orders@jalalsgroup.com). */
export function getExtraStaffEmails(): string[] {
  const raw = process.env.EMAIL_STAFF_EXTRA?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
