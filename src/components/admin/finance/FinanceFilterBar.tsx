"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { AdminInput, AdminSelect } from "@/components/admin/ui";

type Field = {
  name: string;
  label: string;
  type?: "text" | "date" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export function FinanceFilterBar({ fields, basePath }: { fields: Field[]; basePath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const path = basePath || pathname;

  function apply(formData: FormData) {
    const query = new URLSearchParams();
    for (const field of fields) {
      const value = String(formData.get(field.name) ?? "").trim();
      if (value) query.set(field.name, value);
    }
    query.delete("page");
    startTransition(() => {
      const qs = query.toString();
      router.push(qs ? `${path}?${qs}` : path);
    });
  }

  function clear() {
    startTransition(() => router.push(path));
  }

  return (
    <form
      action={apply}
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        apply(new FormData(e.currentTarget));
      }}
    >
      {fields.map((field) => (
        <div key={field.name} className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
            {field.label}
          </label>
          {field.type === "select" ? (
            <AdminSelect name={field.name} defaultValue={searchParams.get(field.name) ?? ""}>
              <option value="">All</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
          ) : (
            <AdminInput
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              defaultValue={searchParams.get(field.name) ?? ""}
            />
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Filtering…" : "Apply"}
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={pending}
          className="rounded-lg border border-navy/15 px-4 py-2 text-sm font-medium text-navy"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
