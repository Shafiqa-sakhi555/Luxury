"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/media/ImageUploader";
import type { AdminHeroImage } from "@/types/media";
import {
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { removeStoreAction, saveStoreAction } from "@/server/stores/actions";
import { slugify } from "@/lib/slug";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { AdminStoreFormValues, AdminStoreRow } from "@/types/admin-store";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "Region is required"),
  address: z.string().min(1, "Location is required"),
  phone: z.string().optional(),
  description: z.string().optional(),
  hours: z.string().optional(),
  productCount: z.number().int().min(0),
  sortOrder: z.number().int().min(0),
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

function BranchFormModal({
  open,
  onClose,
  branch,
  nextSortOrder,
}: {
  open: boolean;
  onClose: () => void;
  branch: AdminStoreRow | null;
  nextSortOrder: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isEdit = Boolean(branch);
  const [heroImage, setHeroImage] = useState<AdminHeroImage>(null);

  useFocusTrap(dialogRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    setHeroImage(
      branch?.imageUrl
        ? { url: branch.imageUrl, publicId: branch.imagePublicId ?? "" }
        : null
    );
  }, [open, branch?.id, branch?.imageUrl, branch?.imagePublicId]);

  const defaultValues: FormValues = {
    name: branch?.name ?? "",
    slug: branch?.slug ?? "",
    city: branch?.city ?? "",
    region: branch?.region ?? "",
    address: branch?.address ?? "",
    phone: branch?.phone ?? "",
    description: branch?.description ?? "",
    hours: branch?.hours ?? "",
    productCount: branch?.productCount ?? 0,
    sortOrder: branch?.sortOrder ?? nextSortOrder,
    isActive: branch && !branch.isActive ? "false" : "true",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: open ? defaultValues : undefined,
  });

  const watchName = form.watch("name");
  const watchSlug = form.watch("slug");
  const bannerKey = `branch-${slugify(watchSlug || watchName || "new") || "new"}`;

  if (!open) return null;

  function onSubmit(values: FormValues) {
    const payload: AdminStoreFormValues = {
      name: values.name,
      slug: values.slug,
      city: values.city,
      region: values.region,
      address: values.address,
      phone: values.phone ?? "",
      description: values.description,
      hours: values.hours,
      imageUrl: heroImage?.url,
      imagePublicId: heroImage?.publicId || null,
      productCount: values.productCount,
      sortOrder: values.sortOrder,
      isActive: values.isActive === "true",
    };

    startTransition(async () => {
      const result = await saveStoreAction({ id: branch?.id, values: payload });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Branch updated." : "Branch added.");
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 sm:p-8">
      <div
        ref={dialogRef}
        className="w-full max-w-2xl rounded-xl border border-navy/10 bg-white shadow-xl"
      >
        <div className="border-b border-navy/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-navy">{isEdit ? "Edit branch" : "Add branch"}</h2>
          <p className="mt-1 text-sm text-muted">
            Card fields: name, region, image, product count. Detail page: description, location, image.
          </p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="branch-name">Branch name</AdminLabel>
              <AdminInput id="branch-name" placeholder="Hunza" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-red">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <AdminLabel htmlFor="branch-region">Region label</AdminLabel>
              <AdminInput id="branch-region" placeholder="Hunza Valley" {...form.register("region")} />
              {form.formState.errors.region && (
                <p className="mt-1 text-xs text-red">{form.formState.errors.region.message}</p>
              )}
            </div>
            <div>
              <AdminLabel htmlFor="branch-city">City</AdminLabel>
              <AdminInput id="branch-city" placeholder="Hunza" {...form.register("city")} />
            </div>
            <div>
              <AdminLabel htmlFor="branch-slug">URL slug (optional)</AdminLabel>
              <AdminInput id="branch-slug" placeholder="hunza" {...form.register("slug")} />
            </div>
          </div>

          <div>
            <AdminLabel htmlFor="branch-address">Location / address</AdminLabel>
            <AdminInput
              id="branch-address"
              placeholder="Hospital Road, Aliabad, Hunza"
              {...form.register("address")}
            />
          </div>

          <div>
            <AdminLabel htmlFor="branch-description">Description</AdminLabel>
            <AdminTextarea
              id="branch-description"
              placeholder="What customers should know about this showroom"
              {...form.register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="branch-phone">Phone</AdminLabel>
              <AdminInput id="branch-phone" placeholder="0355 4323944" {...form.register("phone")} />
            </div>
            <div>
              <AdminLabel htmlFor="branch-hours">Hours (optional)</AdminLabel>
              <AdminInput id="branch-hours" placeholder="Open daily" {...form.register("hours")} />
            </div>
            <div>
              <AdminLabel htmlFor="branch-products">Products count (card)</AdminLabel>
              <AdminInput
                id="branch-products"
                type="number"
                min={0}
                {...form.register("productCount", { valueAsNumber: true })}
              />
            </div>
            <div>
              <AdminLabel htmlFor="branch-sort">Sort order</AdminLabel>
              <AdminInput
                id="branch-sort"
                type="number"
                min={0}
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <AdminLabel htmlFor="branch-status">Status</AdminLabel>
            <AdminSelect id="branch-status" {...form.register("isActive")}>
              <option value="true">Active — shown on homepage</option>
              <option value="false">Hidden</option>
            </AdminSelect>
          </div>

          <ImageUploader
            label="Branch image"
            value={heroImage}
            onChange={setHeroImage}
            bannerKey={bannerKey}
          />

          <div className="flex justify-end gap-2 border-t border-navy/10 pt-4">
            <AdminButton type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add branch"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BranchManager({ branches }: { branches: AdminStoreRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminStoreRow | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <AdminPageHeader
        title="Branches"
        description="Showrooms on the homepage carousel. Clicking a card opens the branch page."
        actions={
          <AdminButton
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Add branch
          </AdminButton>
        }
      />

      <AdminCard className="overflow-hidden">
        {branches.length === 0 ? (
          <p className="p-6 text-sm text-muted">
            No branches yet. Add one to show it in the homepage showrooms section.
          </p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {branches.map((branch) => (
              <li key={branch.id} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  {branch.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={branch.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-navy/5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy">{branch.name}</p>
                  <p className="text-xs text-muted">
                    {branch.region} · {branch.city}
                    {branch.isActive ? "" : " · Hidden"}
                  </p>
                  <p className="truncate text-xs text-muted">{branch.address}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/stores/${branch.slug}`}
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-navy hover:bg-navy/5"
                    target="_blank"
                  >
                    View
                  </Link>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(branch);
                      setOpen(true);
                    }}
                    aria-label={`Edit ${branch.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    aria-label={`Delete ${branch.name}`}
                    onClick={() => {
                      if (!confirm(`Remove ${branch.name} from the storefront?`)) return;
                      startTransition(async () => {
                        const result = await removeStoreAction({ id: branch.id });
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success(result.archived ? "Branch hidden." : "Branch deleted.");
                        router.refresh();
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red" />
                  </AdminButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <BranchFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        branch={editing}
        nextSortOrder={branches.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1}
      />
    </div>
  );
}
