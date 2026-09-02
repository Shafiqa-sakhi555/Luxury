"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const values = schema.parse(input);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { ok: false as const, error: "You must be signed in to change your password." };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: values.currentPassword,
    });

    if (verifyError) {
      return { ok: false as const, error: "Current password is incorrect." };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.newPassword,
    });

    if (updateError) {
      return { ok: false as const, error: updateError.message };
    }

    return { ok: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid password details." };
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not update password.",
    };
  }
}
