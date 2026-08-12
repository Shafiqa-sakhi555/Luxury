import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ProductForm } from "@/components/admin/catalog/ProductForm";
import { adminListCategoryOptions } from "@/server/catalog/admin-queries";

export default async function AdminNewProductPage() {
  const categories = await adminListCategoryOptions().catch(() => []);

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
