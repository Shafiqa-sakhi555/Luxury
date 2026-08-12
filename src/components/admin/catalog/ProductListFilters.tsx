import { AdminInput, AdminButton, AdminSelect } from "@/components/admin/ui";

export function ProductListFilters({
  search,
  status,
  categorySlug,
  categories,
}: {
  search?: string;
  status?: string;
  categorySlug?: string;
  categories: Array<{ slug: string; name: string }>;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3" method="get">
      <div className="min-w-[220px] flex-1">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
          Search
        </label>
        <AdminInput name="search" defaultValue={search} placeholder="Name, slug, category..." />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
          Status
        </label>
        <AdminSelect name="status" defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </AdminSelect>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
          Category
        </label>
        <AdminSelect name="category" defaultValue={categorySlug ?? ""}>
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </AdminSelect>
      </div>
      <AdminButton type="submit">Filter</AdminButton>
    </form>
  );
}
