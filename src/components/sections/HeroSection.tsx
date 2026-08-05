"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronDown,
  ArrowRight,
  Shield,
  Truck,
  Wrench,
  Ruler,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { TextReveal } from "@/components/shared/TextReveal";
import { categories } from "@/lib/categories";
import { images } from "@/lib/data";
import { heroContent, heroTrustBadges } from "@/lib/homeContent";
import { useLogoIntroSafe } from "@/contexts/LogoIntroContext";

const badgeIcons = {
  shield: Shield,
  truck: Truck,
  wrench: Wrench,
  ruler: Ruler,
  award: Award,
};

export function HeroSection() {
  const intro = useLogoIntroSafe();
  const d = intro?.skipIntro ? 0.35 : 2.7;

  return (
    <section
      aria-label="Premium carpets, rugs and home interiors in Pakistan"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ink"
    >
      <div className="absolute inset-0">
        <Image
          src={images.hero}
          alt="Jalals Home Solution — luxury carpets, rugs and home interiors in Gilgit-Baltistan"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/45 to-luxury-cream/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 via-transparent to-white/30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-36 pb-12 sm:px-6 sm:pt-40 sm:pb-16 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: d }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white backdrop-blur-md sm:text-xs">
              <MapPin className="h-3.5 w-3.5 text-red" aria-hidden />
              {heroContent.badge}
            </span>
          </motion.div>

          <div className="mt-6 sm:mt-8">
            <TextReveal
              as="h1"
              className="font-display text-[1.75rem] font-light leading-[1.15] tracking-tight text-white text-balance sm:text-4xl md:text-5xl lg:text-6xl xl:text-[3.5rem]"
              delay={d + 0.15}
            >
              {heroContent.headline}
            </TextReveal>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: d + 0.45 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-[1.75] text-white/88 sm:mt-8 sm:text-base md:text-lg"
          >
            {heroContent.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: d + 0.58 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          >
            <MagneticButton>
              <Button
                asChild
                variant="default"
                size="lg"
                className="min-w-[200px] shadow-xl shadow-red/25 transition-transform hover:scale-[1.02]"
              >
                <Link href={heroContent.primaryCta.href}>
                  {heroContent.primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </MagneticButton>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[200px] border-white/50 bg-transparent text-white transition-all hover:scale-[1.02] hover:border-white hover:bg-white/10 hover:text-white"
            >
              <Link href={heroContent.secondaryCta.href}>{heroContent.secondaryCta.label}</Link>
            </Button>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: d + 0.72 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:mt-10 sm:gap-x-6"
            aria-label="Trust highlights"
          >
            {heroTrustBadges.map((badge) => {
              const Icon = badgeIcons[badge.icon];
              return (
                <li
                  key={badge.label}
                  className="inline-flex items-center gap-1.5 text-[11px] text-white/85 sm:text-xs"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-red" aria-hidden />
                  {badge.label}
                </li>
              );
            })}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: d + 0.85 }}
          className="mx-auto mt-10 max-w-4xl sm:mt-12"
        >
          <form
            role="search"
            aria-label="Search products"
            className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white p-3 shadow-2xl shadow-ink/20 sm:gap-0 sm:rounded-full sm:p-2 sm:pl-5 md:flex-row md:items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-1 items-center gap-3 px-2 sm:px-3 md:border-r md:border-navy/10 md:pr-4">
              <Search className="h-5 w-5 shrink-0 text-red" aria-hidden />
              <input
                type="search"
                placeholder={heroContent.searchPlaceholder}
                className="h-12 w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-muted outline-none sm:h-14 sm:text-base"
                aria-label="Search products"
              />
            </div>
            <div className="relative flex flex-1 items-center gap-3 px-2 sm:px-3">
              <label htmlFor="hero-category" className="sr-only">
                {heroContent.categoryLabel}
              </label>
              <ChevronDown
                className="pointer-events-none absolute right-5 h-4 w-4 text-muted sm:right-6"
                aria-hidden
              />
              <select
                id="hero-category"
                className="h-12 w-full appearance-none rounded-xl bg-luxury-cream/80 px-3 text-sm text-ink outline-none sm:h-14 sm:rounded-full sm:bg-transparent sm:pl-0 sm:text-base"
                defaultValue=""
              >
                <option value="">{heroContent.categoryLabel}</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="h-12 w-full shrink-0 sm:h-14 md:w-auto md:rounded-full md:px-8"
            >
              <Search className="h-4 w-4" />
              {heroContent.searchButton}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
