"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Heart, Search, ShoppingBag, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
import { useLogoIntro } from "@/contexts/LogoIntroContext";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/utils";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ShopNavCategory } from "@/components/layout/AppShell";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Stores", href: "/stores" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const COLLECTIONS_PANEL_ID = "collections-menu-panel";

export function Navbar({ shopCategories = [] }: { shopCategories?: ShopNavCategory[] }) {
  const pathname = usePathname();
  const { showNavLogo, showNavLabel } = useLogoIntro();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [accountHref, setAccountHref] = useState("/login?callbackUrl=/account");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useFocusTrap(mobileMenuRef, mobileOpen, () => setMobileOpen(false));

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isCollectionsActive() {
    return (
      pathname === "/categories" ||
      pathname.startsWith("/categories/") ||
      shopCategories.some(
        (cat) => pathname === cat.href || pathname.startsWith(`${cat.href}/`)
      )
    );
  }

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
    setCollectionsOpen(false);
    setMobileOpen(false);
    setMobileCollectionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setCollectionsOpen(false);
        setMobileCollectionsOpen(false);
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

  useEffect(() => {
    const supabase = tryCreateSupabaseBrowserClient();
    if (!supabase) return;

    const syncAccountHref = (user: { id: string } | null | undefined) => {
      setAccountHref(user ? "/account" : "/login?callbackUrl=/account");
    };

    supabase.auth.getUser().then(({ data }) => syncAccountHref(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncAccountHref(session?.user);
    });

    return () => subscription.unsubscribe();
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
                aria-current={isActive(link.href) ? "page" : undefined}
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
                type="button"
                id="collections-menu-button"
                aria-controls={COLLECTIONS_PANEL_ID}
                aria-expanded={collectionsOpen}
                aria-haspopup="true"
                onClick={() => setCollectionsOpen((open) => !open)}
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors hover:text-red",
                  isCollectionsActive() ? "text-red" : "text-navy/75"
                )}
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
                  <div className="absolute left-1/2 top-full z-[60] w-56 -translate-x-1/2 pt-2">
                    <motion.div
                      id={COLLECTIONS_PANEL_ID}
                      role="menu"
                      aria-labelledby="collections-menu-button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden rounded-2xl border border-navy/10 bg-white py-2 shadow-xl"
                    >
                      <div className="brand-accent-bar absolute inset-x-0 top-0" />
                      <div className="relative flex flex-col py-1">
                        <Link
                          href="/categories"
                          role="menuitem"
                          aria-current={pathname === "/categories" ? "page" : undefined}
                          className={cn(
                            "px-4 py-2.5 text-sm font-medium transition-colors hover:bg-luxury-cream hover:text-red",
                            pathname === "/categories" ? "text-red" : "text-navy"
                          )}
                          onClick={() => setCollectionsOpen(false)}
                        >
                          All collections
                        </Link>
                        {shopCategories.map((category) => (
                          <Link
                            key={category.slug}
                            href={category.href}
                            role="menuitem"
                            aria-current={
                              pathname === category.href || pathname.startsWith(`${category.href}/`)
                                ? "page"
                                : undefined
                            }
                            className={cn(
                              "px-4 py-2.5 text-sm font-medium transition-colors hover:bg-luxury-cream hover:text-red",
                              pathname === category.href || pathname.startsWith(`${category.href}/`)
                                ? "text-red"
                                : "text-navy"
                            )}
                            onClick={() => setCollectionsOpen(false)}
                          >
                            {category.label}
                          </Link>
                        ))}
                      </div>
                      <div className="relative border-t border-navy/8 px-4 py-2">
                        <Link
                          href="/shop"
                          role="menuitem"
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-red hover:underline"
                          onClick={() => setCollectionsOpen(false)}
                        >
                          View full catalog
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className="text-sm font-medium text-navy/75 transition-colors hover:text-red"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="Search" asChild>
              <Link href="/#hero-search">
                <Search className="h-4.5 w-4.5" />
              </Link>
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
              <Link href={accountHref}>
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
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
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
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive("/") ? "page" : undefined}
                  className="font-display text-2xl text-navy"
                >
                  Home
                </Link>

                <div>
                  <button
                    type="button"
                    onClick={() => setMobileCollectionsOpen((open) => !open)}
                    aria-expanded={mobileCollectionsOpen}
                    className="flex w-full items-center justify-between font-display text-2xl text-navy"
                  >
                    Collections
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-navy/60 transition-transform",
                        mobileCollectionsOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileCollectionsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 ml-2 flex flex-col gap-2 border-l-2 border-red/20 pl-4">
                          <Link
                            href="/categories"
                            onClick={() => setMobileOpen(false)}
                            className="text-lg text-navy/75 hover:text-red"
                          >
                            All collections
                          </Link>
                          {shopCategories.map((category) => (
                            <Link
                              key={category.slug}
                              href={category.href}
                              onClick={() => setMobileOpen(false)}
                              className="text-lg text-navy/75 hover:text-red"
                            >
                              {category.label}
                            </Link>
                          ))}
                          <Link
                            href="/shop"
                            onClick={() => setMobileOpen(false)}
                            className="text-sm font-medium text-red"
                          >
                            View full catalog
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {navLinks.slice(1).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className="font-display text-2xl text-navy"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={accountHref}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive("/account") ? "page" : undefined}
                  className="font-display text-2xl text-navy"
                >
                  My account
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
