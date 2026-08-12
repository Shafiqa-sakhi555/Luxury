import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ProductForm } from "@/components/admin/catalog/ProductForm";
import { ProductDeleteButton } from "@/components/admin/catalog/ProductDeleteButton";
import { adminGetProduct, adminListCategoryOptions } from "@/server/catalog/admin-queries";
import type { CatalogSource } from "@/types/admin-catalog";

export default async function AdminEditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const source = (sp.source === "supabase" ? "supabase" : "prisma") as CatalogSource;

  const [product, categories] = await Promise.all([
    adminGetProduct(id, source),
    adminListCategoryOptions(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Edit product"
        description={product.name}
        actions={
          <div className="flex items-center gap-4">
            <Link
              href={`/products/${product.slug}`}
              className="text-sm text-navy hover:underline"
              target="_blank"
            >
              View on storefront
            </Link>
            <Link href="/admin/catalog/products" className="text-sm text-navy hover:underline">
              Back to products
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="rounded-md bg-navy/5 px-2 py-1 uppercase tracking-wide">
          {source === "supabase" ? "Supabase catalog" : "Standard catalog"}
        </span>
        <span>{product.categoryName}</span>
        <span>/{product.slug}</span>
      </div>

      <ProductForm categories={categories} product={product} />

      <div className="mt-10 max-w-md">
        <ProductDeleteButton id={product.id} source={source} name={product.name} />
      </div>
    </div>
  );
}
