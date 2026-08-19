import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  AdminTableEmpty,
  AdminTableToolbar,
  StockStatusBadge,
  AdminBadge,
} from "@/components/admin/ui";

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
      .limit(100),
    supabase
      .from("product_variant_inventory")
      .select("id, stock_quantity, stock_status, product_variants(sku, name, products(name))")
      .order("stock_quantity", { ascending: true, nullsFirst: true })
      .limit(100),
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

  const outOfStock = lowStock.filter((row) => row.status === "out_of_stock").length;

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Stock levels for simple products and carpet variants"
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <AdminCard className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Low stock</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-navy">{lowStock.length}</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Out of stock</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red">{outOfStock}</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Tracked SKUs</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-navy">{rows.length}</p>
        </AdminCard>
      </div>

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">Items at or below 5 units</p>
        </AdminTableToolbar>

        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Item</AdminTableHead>
              <AdminTableHead>SKU</AdminTableHead>
              <AdminTableHead>Type</AdminTableHead>
              <AdminTableHead align="right">Qty</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {lowStock.length === 0 ? (
              <AdminTableEmpty
                colSpan={5}
                title="No low-stock items"
                description="All tracked SKUs are above the low-stock threshold."
              />
            ) : (
              lowStock.map((row) => (
                <AdminTableRow key={`${row.kind}-${row.id}`}>
                  <AdminTableCell className="font-medium text-navy">{row.label}</AdminTableCell>
                  <AdminTableCell className="text-muted">{row.sku}</AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge tone="muted">{row.kind}</AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell align="right" className="tabular-nums font-medium">
                    {row.quantity ?? "—"}
                  </AdminTableCell>
                  <AdminTableCell>
                    <StockStatusBadge status={row.status} />
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTableBody>
        </AdminTable>
      </AdminCard>
    </div>
  );
}
