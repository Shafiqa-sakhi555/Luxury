"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Heart, Search, ShoppingBag, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
import { categories } from "@/lib/categories";
import { SUPABASE_CATALOG_SLUGS, normalizeCategorySlug } from "@/lib/supabase/catalog-categories";
import { useLogoIntro } from "@/contexts/LogoIntroContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Stores", href: "/stores" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const collectionFeatured = [
  {
    label: "Carpets",
    href: "/shop?category=carpets",
    description: "Wall-to-wall & handmade carpets",
  },
  {
    label: "Furniture",
    href: "/shop?category=furniture",
    description: "Sofas, beds, dining & more",
  },
];

const navCategories = categories.filter((category) => {
  const canonical = normalizeCategorySlug(category.slug) ?? category.slug;
  return !(SUPABASE_CATALOG_SLUGS as readonly string[]).includes(canonical);
});

export function Navbar() {
  const { showNavLogo, showNavLabel } = useLogoIntro();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setCollectionsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCollectionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        className={cn(
          "relative w-full transition-all duration-300 ease-out",
          scrolled
            ? "border-b border-navy/10 bg-white/98 py-3 shadow-md shadow-navy/5 backdrop-blur-md"
            : "bg-white/90 py-4 backdrop-blur-sm sm:py-5"
        )}
      >
        <div className="brand-accent-bar absolute inset-x-0 bottom-0 opacity-80" />
        <nav
          className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <Link href="/" className="flex items-center gap-3 sm:gap-3.5">
            {showNavLogo ? (
              <BrandLogo size="nav" layoutId priority />
            ) : (
              <div className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" aria-hidden />
            )}
            {showNavLabel ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="hidden sm:block"
              >
                <BrandWordmark />
              </motion.div>
            ) : (
              <div className="hidden h-11 w-32 shrink-0 sm:block" aria-hidden />
            )}
          </Link>

          <div className="hidden xl:flex xl:items-center xl:gap-7">
            {navLinks.slice(0, 1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy/75 transition-colors hover:text-red"
              >
                {link.label}
              </Link>
            ))}

            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={() => setCollectionsOpen(true)}
              onMouseLeave={() => setCollectionsOpen(false)}
            >
              <button
                onClick={() => setCollectionsOpen(!collectionsOpen)}
                className="flex items-center gap-1 text-sm font-medium text-navy/75 transition-colors hover:text-red focus:outline-none"
                aria-expanded={collectionsOpen}
                aria-haspopup="true"
              >
                Collections
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    collectionsOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {collectionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 top-full z-55 mt-2 w-[520px] -translate-x-1/2 overflow-hidden rounded-2xl border border-navy/10 bg-white p-6 shadow-xl"
                  >
                    <div className="brand-accent-bar absolute inset-x-0 top-0" />
                    <p className="relative mb-3 mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red">
                      Featured
                    </p>
                    <div className="relative mb-4 grid grid-cols-2 gap-2">
                      {collectionFeatured.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group rounded-xl bg-luxury-cream p-3 transition-colors hover:bg-red/5 ring-1 ring-navy/8 hover:ring-red/25"
                          onClick={() => setCollectionsOpen(false)}
                        >
                          <span className="block text-sm font-semibold text-navy group-hover:text-red">
                            {item.label}
                          </span>
                          <span className="block text-[11px] text-muted">{item.description}</span>
                        </Link>
                      ))}
                    </div>
                    <p className="relative mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                      All Categories
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {navCategories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/shop?category=${category.slug}`}
                          className="group rounded-lg p-2 transition-colors hover:bg-luxury-cream"
                          onClick={() => setCollectionsOpen(false)}
                        >
                          <span className="block text-sm font-semibold text-navy group-hover:text-red">
                            {category.name}
                          </span>
                          <span className="block text-[11px] text-muted line-clamp-1">
                            {category.description}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/shop"
                      className="mt-4 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-red hover:underline"
                      onClick={() => setCollectionsOpen(false)}
                    >
                      View Full Catalog
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy/75 transition-colors hover:text-red"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-4.5 w-4.5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Wishlist" className="hidden sm:inline-flex">
              <Heart className="h-4.5 w-4.5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Cart" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-4.5 w-4.5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Account" className="hidden sm:inline-flex" asChild>
              <Link href="/login">
                <User className="h-4.5 w-4.5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden ml-1"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white xl:hidden"
          >
            <div className="flex h-full flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                  <BrandLogo size="mobile" />
                  <BrandWordmark />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-10 flex flex-col gap-4 overflow-y-auto">
                <Link href="/" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-navy">
                  Home
                </Link>
                <Link href="/shop" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-navy">
                  Collections
                </Link>
                <div className="ml-4 flex flex-col gap-2 border-l-2 border-red/20 pl-4">
                  {collectionFeatured.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-lg text-navy/75 hover:text-red"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/shop"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium text-red"
                  >
                    View all categories
                  </Link>
                </div>
                <Link href="/#products" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-navy">
                  Offers
                </Link>
                <Link href="/about" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-navy">
                  About
                </Link>
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-navy">
                  Contact
                </Link>
              </div>

              <div className="mt-auto pt-6">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    window.location.href = "/shop";
                  }}
                >
                  Explore Collection
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
