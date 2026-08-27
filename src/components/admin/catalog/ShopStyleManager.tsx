"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/media/ImageUploader";
import type { AdminHeroImage } from "@/types/media";
import {
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminSelect,
} from "@/components/admin/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { removeShopStyleAction, saveShopStyleAction } from "@/server/shop-styles/actions";
import { slugify } from "@/lib/slug";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { AdminShopStyleFormValues, AdminShopStyleRow } from "@/types/admin-shop-style";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string(),
  href: z.string().min(1, "Link is required"),
  sortOrder: z.number().int().min(0),
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

function ShopStyleFormModal({
  open,
  onClose,
  style,
  nextSortOrder,
}: {
  open: boolean;
  onClose: () => void;
  style: AdminShopStyleRow | null;
  nextSortOrder: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isEdit = Boolean(style);
  const [heroImage, setHeroImage] = useState<AdminHeroImage>(null);

  useFocusTrap(dialogRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    setHeroImage(
      style?.imageUrl ? { url: style.imageUrl, publicId: style.imagePublicId ?? "" } : null
    );
  }, [open, style?.id, style?.imageUrl, style?.imagePublicId]);

  const defaultValues: FormValues = {
    title: style?.title ?? "",
    subtitle: style?.subtitle ?? "",
    href: style?.href ?? "/shop?category=",
    sortOrder: style?.sortOrder ?? nextSortOrder,
    isActive: style && !style.isActive ? "false" : "true",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: open ? defaultValues : undefined,
  });

  const watchTitle = form.watch("title");
  const bannerKey = `shop-style-${slugify(watchTitle || style?.slug || "new") || "new"}`;

  if (!open) return null;

  function onSubmit(values: FormValues) {
    const payload: AdminShopStyleFormValues = {
      title: values.title,
      subtitle: values.subtitle,
      href: values.href,
      imageUrl: heroImage?.url,
      imagePublicId: heroImage?.publicId || null,
      sortOrder: values.sortOrder,
      isActive: values.isActive === "true",
    };

    startTransition(async () => {
      const result = await saveShopStyleAction({ id: style?.id, values: payload });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Style card updated." : "Style card added.");
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 sm:p-8">
      <div ref={dialogRef} className="w-full max-w-2xl rounded-xl border border-navy/10 bg-white shadow-xl">
        <div className="border-b border-navy/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-navy">{isEdit ? "Edit style card" : "Add style card"}</h2>
          <p className="mt-1 text-sm text-muted">
            Homepage “Shop by style” card: photo, title, subtitle, and shop link.
          </p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="style-title">Title</AdminLabel>
              <AdminInput id="style-title" placeholder="Persian Rugs" {...form.register("title")} />
            </div>
            <div>
              <AdminLabel htmlFor="style-subtitle">Subtitle</AdminLabel>
              <AdminInput
                id="style-subtitle"
                placeholder="Traditional & classical"
                {...form.register("subtitle")}
              />
            </div>
          </div>

          <div>
            <AdminLabel htmlFor="style-href">Link</AdminLabel>
            <AdminInput
              id="style-href"
              placeholder="/shop?category=rugs"
              {...form.register("href")}
            />
            <p className="mt-1 text-xs text-muted">
              Site path only, e.g. <code>/shop?category=rugs</code> or <code>/categories/furniture</code>.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="style-sort">Sort order</AdminLabel>
              <AdminInput
                id="style-sort"
                type="number"
                min={0}
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div>
              <AdminLabel htmlFor="style-status">Status</AdminLabel>
              <AdminSelect id="style-status" {...form.register("isActive")}>
                <option value="true">Active — shown on homepage</option>
                <option value="false">Hidden</option>
              </AdminSelect>
            </div>
          </div>

          <ImageUploader
            label="Card image"
            value={heroImage}
            onChange={setHeroImage}
            bannerKey={bannerKey}
          />

          <div className="flex justify-end gap-2 border-t border-navy/10 pt-4">
            <AdminButton type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add card"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ShopStyleManager({ styles }: { styles: AdminShopStyleRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminShopStyleRow | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <AdminPageHeader
        title="Shop styles"
        description="The six homepage cards under “Your Imagination, Our Craftsmanship.” Add, edit, hide, or replace photos."
        actions={
          <AdminButton
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Add card
          </AdminButton>
        }
      />

      <AdminCard className="overflow-hidden">
        {styles.length === 0 ? (
          <p className="p-6 text-sm text-muted">
            No style cards yet. Add one to show it on the homepage, or run the shop_styles SQL in
            Supabase to load the current six cards.
          </p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {styles.map((style) => (
              <li key={style.id} className="flex items-start gap-4 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                  {style.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={style.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-navy/5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy">{style.title}</p>
                    {!style.isActive ? <span className="text-xs text-amber-700">Hidden</span> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{style.subtitle}</p>
                  <p className="mt-1 truncate text-xs text-muted">{style.href}</p>
                </div>
                <div className="flex items-center gap-1">
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(style);
                      setOpen(true);
                    }}
                    aria-label={`Edit ${style.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    aria-label={`Delete ${style.title}`}
                    onClick={() => {
                      if (!confirm(`Remove the “${style.title}” card from the homepage?`)) return;
                      startTransition(async () => {
                        const result = await removeShopStyleAction({ id: style.id });
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success("Style card deleted.");
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

      <ShopStyleFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        style={editing}
        nextSortOrder={styles.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1}
      />
    </div>
  );
}
