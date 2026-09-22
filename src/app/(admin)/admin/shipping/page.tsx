import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { canWriteCatalog } from "@/server/rbac";
import { getShippingRates } from "@/server/shipping/settings";
import { redirect } from "next/navigation";
import { ShippingSettingsForm } from "@/components/admin/shipping/ShippingSettingsForm";

export default async function AdminShippingPage() {
  const ctx = await requireAdminPageAccess();
  if (!canWriteCatalog(ctx.permissions)) {
    redirect("/admin");
  }

  const rates = await getShippingRates();

  return (
    <div>
      <AdminPageHeader
        title="Shipping Rates"
        description="Manage courier, cargo, and furniture shipping rates based on weight."
      />
      
      <div className="mt-6">
        <ShippingSettingsForm initialRates={rates} />
      </div>
    </div>
  );
}
