import Link from "next/link";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { getStoreSettings } from "@/server/settings/store-settings";
import { toMajor } from "@/lib/money";
import { DeliverySettingsForm } from "@/components/admin/settings/DeliverySettingsForm";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { canWriteCatalog } from "@/server/rbac";

export default async function AdminSettingsPage() {
  const ctx = await requireAdminPageAccess();
  const canEditStore = canWriteCatalog(ctx.permissions);
  const settings = canEditStore ? await getStoreSettings() : null;

  return (
    <div>
      <AdminPageHeader title="Settings" description="Your account, store configuration, and catalog help" />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="space-y-4 p-6 text-sm">
          <h2 className="font-semibold text-navy">Change password</h2>
          <p className="text-muted leading-relaxed">
            Update the password for <span className="font-medium text-navy">{ctx.user.email}</span>.
            You will stay signed in after saving.
          </p>
          <ChangePasswordForm variant="admin" />
        </AdminCard>

        {canEditStore && settings ? (
          <AdminCard className="space-y-4 p-6 text-sm">
            <h2 className="font-semibold text-navy">Delivery charges</h2>
            <p className="text-muted leading-relaxed">
              These amounts are used on cart, checkout, and product shipping information.
            </p>
            <DeliverySettingsForm
              deliveryFeeMajor={toMajor(settings.deliveryFeeMinor)}
              freeDeliveryThresholdMajor={toMajor(settings.freeDeliveryThresholdMinor)}
            />
          </AdminCard>
        ) : null}

        <AdminCard className="space-y-4 p-6 text-sm lg:col-span-2">
          <h2 className="font-semibold text-navy">Managing products</h2>
          <p className="text-muted leading-relaxed">
            Use{" "}
            <Link href="/admin/catalog/products" className="text-navy underline">
              Products
            </Link>{" "}
            to add, edit, or remove items. Changes save directly to the database and appear on the
            storefront after you set status to <strong>Active</strong>.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>
              <strong>Curtains / Prayer mats / Carpets</strong> — Supabase catalog collections
            </li>
            <li>Upload product and category images directly — files are stored in Cloudinary</li>
            <li>Products with order history are archived instead of permanently deleted</li>
          </ul>
          <div className="space-y-3 border-t border-navy/10 pt-4">
            <div>
              <p className="font-medium text-navy">Currency</p>
              <p className="text-muted">PKR — enter prices in rupees (e.g. 112 for Rs 112/sq ft)</p>
            </div>
            <div>
              <p className="font-medium text-navy">Payment</p>
              <p className="text-muted">Cash on delivery enabled. Online gateway — post-launch.</p>
            </div>
            <div>
              <p className="font-medium text-navy">Admin login</p>
              <p className="text-muted">
                Sign in at /admin/login with your staff account (not a customer account).
              </p>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
