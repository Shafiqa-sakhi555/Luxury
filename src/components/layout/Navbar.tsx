"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Heart, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#showrooms", label: "Showrooms" },
  { href: "#products", label: "Products" },
  { href: "#craft", label: "Craftsmanship" },
  { href: "#collections", label: "Collections" },
  { href: "#membership", label: "Plans" },
  { href: "#journal", label: "Blog" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "py-2 sm:py-3" : "py-4 sm:py-6"
        )}
      >
        <nav
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-500 sm:px-6 lg:px-8",
            scrolled && "glass-strong mx-3 rounded-2xl py-3 px-4 sm:mx-4 sm:rounded-full sm:px-6 lg:mx-8"
          )}
        >
          <Link href="/" className="group flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-display text-xl font-light tracking-[0.12em] text-ivory sm:text-2xl sm:tracking-[0.15em]">
              LEXURY
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-gold sm:text-[10px]">
              Gilgit Baltistan
            </span>
          </Link>

          <div className="hidden items-center gap-6 xl:flex xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ivory/60 transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="gold" size="sm" className="hidden md:flex">
              <ShoppingBag className="h-4 w-4" />
              Shop Now
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-midnight/98 backdrop-blur-xl xl:hidden"
          >
            <div className="flex h-full flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display text-2xl tracking-[0.15em]">LEXURY</span>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Gilgit Baltistan</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-12 flex flex-col gap-5 sm:mt-16 sm:gap-6">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="font-display text-2xl text-ivory/80 hover:text-gold sm:text-3xl"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-auto space-y-3">
                <Button variant="gold" className="w-full">
                  <ShoppingBag className="h-4 w-4" />
                  Shop Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
