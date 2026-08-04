"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Heart, Search, ShoppingBag, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
import { categories } from "@/lib/categories";
import { useLogoIntro } from "@/contexts/LogoIntroContext";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { showNavLogo, showNavLabel } = useLogoIntro();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
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
        setShopOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShopOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-out",
          scrolled
            ? "border-b border-navy/10 bg-white/95 py-2 shadow-md shadow-navy/5 backdrop-blur-md"
            : "bg-white/85 py-3 backdrop-blur-sm sm:py-4"
        )}
      >
        <div className="brand-accent-bar absolute inset-x-0 bottom-0 opacity-80" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-navy/70 transition-colors hover:text-red"
            >
              Home
            </Link>

            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <button
                onClick={() => setShopOpen(!shopOpen)}
                onFocus={() => setShopOpen(true)}
                className="flex items-center gap-1 text-sm font-medium text-navy/70 transition-colors hover:text-red focus:outline-none"
                aria-expanded={shopOpen}
                aria-haspopup="true"
              >
                Shop
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    shopOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {shopOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-1/2 top-full z-55 mt-2 w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl border border-blue/15 bg-white p-6 shadow-xl shadow-navy/10"
                  >
                    <div className="brand-accent-bar absolute inset-x-0 top-0" />
                    <p className="relative mb-4 mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red">
                      All Categories
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/shop?category=${category.slug}`}
                          className="group rounded-lg p-2 transition-colors hover:bg-mist"
                          onClick={() => setShopOpen(false)}
                        >
                          <span className="block text-sm font-semibold text-navy group-hover:text-red">
                            {category.name}
                          </span>
                          <span className="block text-[11px] text-muted">
                            {category.description}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/shop"
                      className="mt-4 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-red hover:underline"
                      onClick={() => setShopOpen(false)}
                    >
                      View Full Catalog
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/about"
              className="text-sm font-medium text-navy/70 transition-colors hover:text-red"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="text-sm font-medium text-navy/70 transition-colors hover:text-red"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-4.5 w-4.5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Wishlist" className="hidden sm:inline-flex">
              <Heart className="h-4.5 w-4.5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red text-[9px] font-bold text-white">
                0
              </span>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Account" className="hidden sm:inline-flex">
              <User className="h-4.5 w-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden ml-1"
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
            className="fixed inset-0 z-[100] bg-white lg:hidden"
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

              <div className="mt-10 flex flex-col gap-5 overflow-y-auto">
                <Link href="/" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-navy">
                  Home
                </Link>
                <Link href="/about" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-navy">
                  About
                </Link>
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-navy">
                  Contact
                </Link>

                <div className="mt-2 border-t border-navy/10 pt-6">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-red">
                    Shop Categories
                  </p>
                  <div className="grid gap-3">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/shop?category=${category.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="text-sm text-navy/70 hover:text-red"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
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
                  Shop Catalog
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
