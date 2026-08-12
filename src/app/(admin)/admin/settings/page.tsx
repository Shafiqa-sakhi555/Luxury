import Link from "next/link";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";

export default function AdminSettingsPage() {
  return (
    <div>
      <AdminPageHeader title="Settings" description="Store configuration and catalog help" />
      <div className="grid gap-6 lg:grid-cols-2">
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
              <strong>Standard catalog</strong> — sofas, beds, decor, and other Prisma categories
            </li>
            <li>
              <strong>Curtains / Prayer mats / Carpets</strong> — Supabase catalog (includes your
              imported carpet collections)
            </li>
            <li>Paste image URLs one per line, or use paths like /images/category/...</li>
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
            <p className="text-muted">Sign in at /login with your staff account (not a customer account).</p>
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
