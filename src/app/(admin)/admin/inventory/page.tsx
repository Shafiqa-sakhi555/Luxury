import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { AdminBadge } from "@/components/admin/ui";

type StockRow = {
  id: string;
  label: string;
  sku: string;
  quantity: number | null;
  status: string;
  kind: "product" | "variant";
};

export default async function AdminInventoryPage() {
  await requireAdminPageAccess("inventory.read");
  const supabase = createSupabaseAdminClient();

  const [{ data: productStock }, { data: variantStock }] = await Promise.all([
    supabase
      .from("inventory")
      .select("id, stock_quantity, stock_status, products(name, sku)")
      .order("stock_quantity", { ascending: true })
      .limit(50),
    supabase
      .from("product_variant_inventory")
      .select("id, stock_quantity, stock_status, product_variants(sku, name, products(name))")
      .order("stock_quantity", { ascending: true, nullsFirst: true })
      .limit(50),
  ]);

  const rows: StockRow[] = [];

  for (const row of productStock ?? []) {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    rows.push({
      id: row.id,
      label: product?.name ?? "Product",
      sku: product?.sku ?? "—",
      quantity: row.stock_quantity,
      status: row.stock_status,
      kind: "product",
    });
  }

  for (const row of variantStock ?? []) {
    const variant = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants;
    const product = variant?.products
      ? Array.isArray(variant.products)
        ? variant.products[0]
        : variant.products
      : null;
    rows.push({
      id: row.id,
      label: variant?.name ?? product?.name ?? "Variant",
      sku: variant?.sku ?? "—",
      quantity: row.stock_quantity,
      status: row.stock_status,
      kind: "variant",
    });
  }

  const lowStock = rows
    .filter((row) => row.quantity === null || row.quantity <= 5)
    .sort((a, b) => (a.quantity ?? -1) - (b.quantity ?? -1));

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Stock levels for simple products and carpet variants"
      />
      <AdminCard className="overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="border-b border-navy/10 bg-[#FAFBFD] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  No low-stock items found.
                </td>
              </tr>
            ) : (
              lowStock.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-b border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{row.label}</td>
                  <td className="px-4 py-3 text-muted">{row.sku}</td>
                  <td className="px-4 py-3 capitalize text-muted">{row.kind}</td>
                  <td className="px-4 py-3 tabular-nums">{row.quantity ?? "—"}</td>
                  <td className="px-4 py-3">
                    <AdminBadge tone={row.status === "in_stock" ? "default" : "warning"}>
                      {row.status}
                    </AdminBadge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
