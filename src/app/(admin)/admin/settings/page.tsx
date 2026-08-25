import Link from "next/link";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { getStoreSettings } from "@/server/settings/store-settings";
import { DeliverySettingsForm } from "@/components/admin/settings/DeliverySettingsForm";
import { formatMoney } from "@/lib/money";

export default async function AdminSettingsPage() {
  await requireAdminPageAccess("*", "settings.write");
  const settings = await getStoreSettings();

  return (
    <div>
      <AdminPageHeader title="Settings" description="Store configuration, delivery charges, and catalog help" />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold text-navy">Delivery charges</h2>
            <p className="mt-1 text-sm text-muted">
              These amounts are applied automatically to cart, checkout, and new orders.
              Current fee: {formatMoney(settings.deliveryFeeMinor)}
              {settings.freeDeliveryThresholdMinor > 0
                ? ` · free above ${formatMoney(settings.freeDeliveryThresholdMinor)}`
                : " · free delivery is off"}
            </p>
          </div>
          <DeliverySettingsForm
            deliveryFeeMinor={settings.deliveryFeeMinor}
            freeDeliveryThresholdMinor={settings.freeDeliveryThresholdMinor}
          />
        </AdminCard>

        <AdminCard className="space-y-4 p-6 text-sm">
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
        </AdminCard>

        <AdminCard className="space-y-4 p-6 text-sm">
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
            <p className="text-muted">Sign in at /admin/login with your staff account (not a customer account).</p>
          </div>
          <div>
            <p className="font-medium text-navy">Database</p>
            <p className="text-muted">
              PostgreSQL + Supabase. Catalog edits sync automatically for cart and checkout.
            </p>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
