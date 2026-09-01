"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AdminButton, AdminInput, AdminLabel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "@/server/auth/password-actions";

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

type FormValues = z.infer<typeof schema>;

export function ChangePasswordForm({ variant = "admin" }: { variant?: "admin" | "account" }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      form.reset();
      toast.success("Password updated.");
    });
  }

  const isAdmin = variant === "admin";
  const Field = isAdmin ? AdminInput : Input;
  const labelClass = isAdmin ? undefined : "mb-1.5 block text-sm font-medium text-navy";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="change-password">
      <div>
        {isAdmin ? (
          <AdminLabel htmlFor={`${variant}-current-password`}>Current password</AdminLabel>
        ) : (
          <label className={labelClass} htmlFor={`${variant}-current-password`}>
            Current password
          </label>
        )}
        <Field
          id={`${variant}-current-password`}
          type="password"
          autoComplete="current-password"
          {...form.register("currentPassword")}
        />
        {form.formState.errors.currentPassword ? (
          <p className="mt-1 text-xs text-red">{form.formState.errors.currentPassword.message}</p>
        ) : null}
      </div>

      <div>
        {isAdmin ? (
          <AdminLabel htmlFor={`${variant}-new-password`}>New password</AdminLabel>
        ) : (
          <label className={labelClass} htmlFor={`${variant}-new-password`}>
            New password
          </label>
        )}
        <Field
          id={`${variant}-new-password`}
          type="password"
          autoComplete="new-password"
          {...form.register("newPassword")}
        />
        {form.formState.errors.newPassword ? (
          <p className="mt-1 text-xs text-red">{form.formState.errors.newPassword.message}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">Use at least 8 characters.</p>
        )}
      </div>

      <div>
        {isAdmin ? (
          <AdminLabel htmlFor={`${variant}-confirm-password`}>Confirm new password</AdminLabel>
        ) : (
          <label className={labelClass} htmlFor={`${variant}-confirm-password`}>
            Confirm new password
          </label>
        )}
        <Field
          id={`${variant}-confirm-password`}
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="mt-1 text-xs text-red">{form.formState.errors.confirmPassword.message}</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red">{error}</p> : null}

      {isAdmin ? (
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </AdminButton>
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      )}
    </form>
  );
}
