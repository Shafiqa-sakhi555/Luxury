import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default async function AccountSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="font-display text-2xl text-navy sm:text-3xl">Settings</h2>
      <p className="mt-2 text-sm text-muted">Manage your account security and sign-in details.</p>

      <Card padding="md" className="mt-8 max-w-lg space-y-4">
        <div>
          <h3 className="font-medium text-navy">Change password</h3>
          {user?.email ? (
            <p className="mt-1 text-sm text-muted">
              Signed in as <span className="font-medium text-navy">{user.email}</span>
            </p>
          ) : null}
        </div>
        <ChangePasswordForm variant="account" />
      </Card>
    </div>
  );
}
