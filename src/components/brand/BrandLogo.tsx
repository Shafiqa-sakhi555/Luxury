"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { images } from "@/lib/images";
import { cn } from "@/lib/utils";

const sizes = {
  nav: {
    box: "h-14 w-14 sm:h-16 sm:w-16",
    image: 128,
    padding: "p-1.5 sm:p-2",
  },
  splash: {
    box: "h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52",
    image: 512,
    padding: "p-3 sm:p-4",
  },
  mobile: {
    box: "h-12 w-12",
    image: 96,
    padding: "p-1",
  },
  footer: {
    box: "h-14 w-14",
    image: 112,
    padding: "p-1.5",
  },
} as const;

type BrandLogoSize = keyof typeof sizes;

type BrandLogoProps = {
  size?: BrandLogoSize;
  layoutId?: boolean;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  size = "nav",
  layoutId = false,
  className,
  priority = false,
}: BrandLogoProps) {
  const config = sizes[size];

  const logo = (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg shadow-navy/10 ring-2 ring-navy/10",
        config.box,
        config.padding,
        className
      )}
    >
      <Image
        src={images.logo}
        alt="Jalals Home Solution"
        width={config.image}
        height={config.image}
        priority={priority}
        className="h-full w-full object-contain drop-shadow-sm"
        sizes={`${config.image}px`}
      />
    </div>
  );

  if (layoutId) {
    return (
      <motion.div layoutId="jalals-brand-logo" className="shrink-0">
        {logo}
      </motion.div>
    );
  }

  return logo;
}

export function BrandWordmark({
  className,
  subtitleClassName,
}: {
  className?: string;
  subtitleClassName?: string;
}) {
  return (
    <div className={cn("min-w-0 leading-tight", className)}>
      <span className="font-display text-xl font-medium tracking-wide sm:text-2xl">
        <span className="text-red">J</span>
        <span className="text-navy">alal&apos;s</span>
      </span>
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.22em] text-navy/75 sm:text-[11px]",
          subtitleClassName
        )}
      >
        Home Solution
      </p>
    </div>
  );
}
