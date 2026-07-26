"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Instagram, Facebook, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
  Shop: [
    { label: "Carpets", href: "#collections" },
    { label: "Sofa Sets", href: "#products" },
    { label: "Curtains", href: "#collections" },
    { label: "All Products", href: "#products" },
  ],
  Company: [
    { label: "About Lexury", href: "#" },
    { label: "Our Showrooms", href: "#showrooms" },
    { label: "Craftsmanship", href: "#craft" },
    { label: "Membership", href: "#membership" },
  ],
  Support: [
    { label: "Delivery Info", href: "#locations" },
    { label: "Care Guides", href: "#journal" },
    { label: "Custom Orders", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
  Contact: [
    { label: "Gilgit City, GB", href: "#" },
    { label: "+92 5811 123456", href: "tel:+925811123456" },
    { label: "info@lexury.pk", href: "mailto:info@lexury.pk" },
  ],
};

const socials = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-glass-border bg-midnight pt-16 pb-6 sm:pt-24 sm:pb-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="font-display text-3xl font-light tracking-[0.12em] text-ivory sm:text-4xl">
                LEXURY
              </h3>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-gold sm:text-xs">
                Gilgit Baltistan, Pakistan
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/50">
                Premium carpets, sofa sets, curtains, and home furnishings —
                handcrafted quality for every home in Gilgit Baltistan.
              </p>

              <div className="mt-5 flex items-start gap-2 text-sm text-ivory/50">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>Main Bazaar, Gilgit City, Gilgit Baltistan 15100</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-ivory/50">
                <Phone className="h-4 w-4 shrink-0 text-gold" />
                <span>+92 5811 123456</span>
              </div>

              <div className="mt-6 sm:mt-8">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-gold sm:mb-3 sm:text-xs">
                  Newsletter
                </p>
                <div className="flex gap-2">
                  <Input placeholder="Your email" className="flex-1 text-sm" />
                  <Button variant="gold" size="icon">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-8 lg:gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory/40 sm:mb-4 sm:text-xs sm:tracking-[0.2em]">
                  {category}
                </h4>
                <ul className="space-y-2 sm:space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs text-ivory/55 transition-colors hover:text-gold sm:text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-glass-border pt-6 sm:mt-20 sm:flex-row sm:gap-6 sm:pt-8">
          <p className="text-center text-[11px] text-ivory/30 sm:text-left sm:text-xs">
            &copy; {new Date().getFullYear()} Lexury — Gilgit Baltistan. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, href, label }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-border text-ivory/40 transition-all hover:border-gold/40 hover:text-gold sm:h-10 sm:w-10"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
