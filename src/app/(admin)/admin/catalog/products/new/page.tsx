import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ProductForm } from "@/components/admin/catalog/ProductForm";
import { adminListCategoryOptions } from "@/server/catalog/admin-queries";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function AdminNewProductPage() {
  await requireAdminPageAccess("product.write");

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-lg border border-red/20 bg-red/5 px-4 py-3 text-sm text-red">
        Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and
        SUPABASE_SERVICE_ROLE_KEY to your environment variables.
      </div>
    );
  }

  const categories = await adminListCategoryOptions();

  return (
    <div>
      <AdminPageHeader
        title="New product"
        description="Add a product to your storefront catalog"
        actions={
          <Link
            href="/admin/catalog/products"
            className="text-sm text-navy hover:underline"
          >
            Back to products
          </Link>
        }
      />
      <ProductForm categories={categories} />
    </div>
  );
}
