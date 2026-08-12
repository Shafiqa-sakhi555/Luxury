import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";

export default function AdminInventoryPage() {
  return (
    <div>
      <AdminPageHeader title="Inventory" description="Branch stock, movements and adjustments" />
      <AdminCard className="p-6 text-sm text-muted">
        Inventory management is wired to the database schema. Connect PostgreSQL, run migrations and seed,
        then stock levels will appear here. Adjustments write to the append-only stock movement ledger.
      </AdminCard>
    </div>
  );
}
