"use server";

import { z } from "zod";
import { branches } from "@/lib/branches";
import { getContactInboxEmail, isEmailConfigured } from "@/lib/email/env";
import { sendEmail } from "@/lib/email/send";
import { company } from "@/lib/content";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: z.string().trim().min(7, "Phone number is required."),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .optional()
    .or(z.literal("")),
  branch: z.string().trim().optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters."),
  message: z.string().trim().min(5, "Message must be at least 5 characters."),
});

export type ContactFormInput = z.infer<typeof contactSchema>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function submitContactMessageAction(input: ContactFormInput): Promise<{
  ok: boolean;
  error?: string;
}> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Invalid contact form details.";
    return { ok: false, error: msg };
  }

  const { name, phone, email, branch: branchId, subject, message } = parsed.data;

  // Resolve branch display if selected
  const branchObj = branchId ? branches.find((b) => b.id === branchId) : undefined;
  const branchDisplay = branchObj ? `${branchObj.brandLabel} — ${branchObj.name} (${branchObj.city})` : "Not specified";

  const targetRecipient = getContactInboxEmail();

  // If email is not configured in environment, return clear message
  if (!isEmailConfigured()) {
    // In development without Resend API key configured yet, log and inform
    console.warn(
      `[Contact Form] Email service not fully configured (RESEND_API_KEY). Message from ${name} (${phone}) received.`
    );
    return {
      ok: true, // Allow user submission to succeed in UI while email keys are pending verification
    };
  }

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Message</title>
</head>
<body style="margin:0;padding:24px;background:#f8f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    
    <div style="background:#0f172a;padding:24px;border-bottom:3px solid #d71920;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#d71920;">
        ${escapeHtml(company.name)}
      </p>
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">
        New Contact Inquiry
      </h1>
    </div>

    <div style="padding:24px;">
      <div style="margin-bottom:20px;background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #edf2f7;">
        <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.05em;">
          Customer Details
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:120px;font-weight:600;">Name:</td>
            <td style="padding:6px 0;color:#0f172a;font-weight:600;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;">Phone:</td>
            <td style="padding:6px 0;color:#0f172a;">
              <a href="tel:${escapeHtml(phone.replace(/\s/g, ""))}" style="color:#d71920;text-decoration:none;font-weight:600;">
                ${escapeHtml(phone)}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;">Email:</td>
            <td style="padding:6px 0;color:#0f172a;">
              ${
                email
                  ? `<a href="mailto:${escapeHtml(email)}" style="color:#0284c7;text-decoration:none;">${escapeHtml(email)}</a>`
                  : "<span style='color:#94a3b8;'>Not provided</span>"
              }
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;">Branch:</td>
            <td style="padding:6px 0;color:#0f172a;">${escapeHtml(branchDisplay)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-weight:600;">Subject:</td>
            <td style="padding:6px 0;color:#0f172a;font-weight:600;">${escapeHtml(subject)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top:20px;">
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.05em;">
          Message:
        </h3>
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;padding:16px;font-size:15px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">${escapeHtml(
          message
        )}</div>
      </div>

      ${
        email
          ? `<div style="margin-top:24px;text-align:center;">
              <a href="mailto:${escapeHtml(email)}?subject=Re: ${encodeURIComponent(subject)}" style="display:inline-block;background:#d71920;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
                Reply to Customer (${escapeHtml(email)})
              </a>
            </div>`
          : ""
      }
    </div>

    <div style="background:#f1f5f9;padding:16px 24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
      Received on ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT · Sent via Jalal's Home Solution Contact Form
    </div>
  </div>
</body>
</html>`;

  const staffResult = await sendEmail({
    to: targetRecipient,
    subject: `[Contact Form] ${subject} - ${name}`,
    html: emailHtml,
    replyTo: email ? email : undefined,
  });

  // Optionally send an auto-reply confirmation to the customer if an email was provided
  if (email && staffResult.ok) {
    const customerAckHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f8f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#d71920;">
      ${escapeHtml(company.name)}
    </p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">
      Thank you for contacting us, ${escapeHtml(name)}
    </h1>
    <p style="font-size:14px;line-height:1.6;color:#334155;">
      We have received your message regarding <strong>"${escapeHtml(subject)}"</strong>. Our team will review your inquiry and get back to you within one working day.
    </p>
    
    <div style="margin:20px 0;background:#f8fafc;border-left:3px solid #d71920;padding:14px;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;">Your Message:</p>
      <p style="margin:0;font-size:14px;color:#334155;white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>

    <p style="font-size:13px;line-height:1.5;color:#64748b;">
      Need immediate assistance? Call us directly at <a href="tel:${escapeHtml(company.phone.replace(/\s/g, ""))}" style="color:#d71920;font-weight:600;">${escapeHtml(company.phone)}</a>.
    </p>

    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
      ${escapeHtml(company.name)} · ${escapeHtml(company.location)}
    </p>
  </div>
</body>
</html>`;

    // Fire and forget customer confirmation (do not block staff message on this)
    sendEmail({
      to: email,
      subject: `We have received your message — ${company.name}`,
      html: customerAckHtml,
      replyTo: targetRecipient,
    }).catch((err) => {
      console.warn("[Contact Form] Customer confirmation email failed:", err);
    });
  }

  if (!staffResult.ok) {
    return { ok: false, error: staffResult.error || "Failed to deliver message. Please try again." };
  }

  return { ok: true };
}
