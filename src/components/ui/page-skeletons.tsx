import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-navy/8 bg-white">
      <Skeleton className="aspect-[4/5] w-full rounded-none" rounded="sm" />
      <div className="space-y-2 p-3 sm:p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function CatalogHeroSkeleton() {
  return (
    <section className="section-brand-light pt-28 pb-12 sm:pb-16">
      <PageContainer>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-10 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <Skeleton className="mt-4 h-4 w-32" />
      </PageContainer>
    </section>
  );
}

export function FilterPillsSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 shrink-0" rounded="full" />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ShopPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading shop">
      <CatalogHeroSkeleton />
      <PageContainer className="py-10 sm:py-12">
        <FilterPillsSkeleton />
        <ProductGridSkeleton className="mt-8" count={12} />
      </PageContainer>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <PageContainer className="pb-16 pt-site-header" aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-8 h-4 w-72 max-w-full" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-square w-full" rounded="lg" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-4 h-12 w-full" rounded="full" />
          <Skeleton className="h-12 w-full" rounded="full" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading cart">
      <Skeleton className="h-9 w-40" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-navy/10 bg-white p-4">
              <Skeleton className="h-24 w-24 shrink-0" rounded="lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-32" rounded="full" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64" rounded="lg" />
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading checkout">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-96" rounded="lg" />
        <Skeleton className="h-64" rounded="lg" />
      </div>
    </div>
  );
}

export function AccountContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading account">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24" rounded="lg" />
        ))}
      </div>
      <Skeleton className="h-48" rounded="lg" />
    </div>
  );
}

export function AdminTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-navy/10 bg-white" aria-busy="true" aria-label="Loading table">
      <div className="flex items-center justify-between border-b border-navy/10 px-4 py-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" rounded="lg" />
      </div>
      <div className="divide-y divide-navy/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" rounded="lg" />
        ))}
      </div>
      <div className="mt-8">
        <AdminTableSkeleton rows={5} />
      </div>
    </div>
  );
}

export function AuthFormSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading form">
      <Skeleton className="h-10 w-full" rounded="lg" />
      <Skeleton className="h-10 w-full" rounded="lg" />
      <Skeleton className="h-10 w-full" rounded="lg" />
      <Skeleton className="h-11 w-full" rounded="lg" />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading homepage">
      <Skeleton className="min-h-[85vh] w-full rounded-none" />
      <PageContainer className="py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" rounded="lg" />
          ))}
        </div>
        <ProductGridSkeleton className="mt-12" count={8} />
      </PageContainer>
    </div>
  );
}
