import Link from "next/link";
import { BrandWordmark } from "@/components/brand/BrandLogo";

type FlowSiteHeaderProps = {
  badge?: string;
  trailing?: React.ReactNode;
};

export function FlowSiteHeader({ badge, trailing }: FlowSiteHeaderProps) {
  return (
    <header className="border-b border-navy/10 bg-white/90 backdrop-blur-md">
      <div className="page-container flex h-16 items-center justify-between sm:h-[4.25rem]">
        <Link href="/" className="shrink-0">
          <BrandWordmark className="text-xl sm:text-2xl" />
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {badge ? (
            <span className="hidden text-muted sm:inline">{badge}</span>
          ) : null}
          {trailing}
        </div>
      </div>
    </header>
  );
}
