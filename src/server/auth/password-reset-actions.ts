"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
}

export async function requestPasswordResetAction(input: {
  email: string;
  portal?: "admin" | "customer";
  origin?: string;
}) {
  try {
    const { email } = emailSchema.parse({ email: input.email.trim().toLowerCase() });
    const supabase = await createSupabaseServerClient();
    const origin = (input.origin || siteUrl()).replace(/\/$/, "");
    const portal = input.portal === "admin" ? "admin" : "customer";
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(`/update-password?portal=${portal}`)}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      console.error("[password-reset]", error.message);
    }

    return {
      ok: true as const,
      message: "If an account exists for that email, we sent a password reset link. Check your inbox.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Enter a valid email." };
    }
    return { ok: false as const, error: "Could not send a reset email. Please try again." };
  }
}

export async function completePasswordResetAction(input: {
  password: string;
  confirmPassword: string;
}) {
  try {
    const values = passwordSchema.parse(input);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false as const,
        error: "This reset link is invalid or has expired. Request a new one from the login page.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid password." };
    }
    return { ok: false as const, error: "Could not update password. Please try again." };
  }
}
