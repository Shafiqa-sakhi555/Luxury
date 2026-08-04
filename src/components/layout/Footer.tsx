"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Instagram, Facebook, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { categories } from "@/lib/categories";
import { company } from "@/lib/content";

const footerLinks = {
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Our Showrooms", href: "/#showrooms" },
    { label: "Contact", href: "/contact" },
    { label: "Custom Orders", href: "/shop" },
  ],
  Support: [
    { label: "Delivery Info", href: "/contact" },
    { label: "Care Guides", href: "/about" },
    { label: "Terms & Conditions", href: "/about" },
    { label: "Privacy Policy", href: "/about" },
  ],
};

const socials = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
];

export function Footer() {
  const shopCategories = categories.slice(0, 6);

  return (
    <footer className="relative border-t border-navy/10 bg-navy pt-16 pb-6 text-white sm:pt-24 sm:pb-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3">
                <BrandLogo size="footer" className="ring-white/20 shadow-black/20" />
                <div>
                  <h3 className="font-display text-2xl font-light text-white">
                    <span className="text-red">J</span>alal&apos;s
                  </h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                    Home Solution
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
                Premium carpets, furniture, flooring and home decor — crafted with
                mountain heritage and delivered across Pakistan.
              </p>

              <div className="mt-5 flex items-start gap-2 text-sm text-white/60">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <span>{company.location}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                <Phone className="h-4 w-4 shrink-0 text-cyan" />
                <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="hover:text-white">
                  {company.phone}
                </a>
              </div>

              <div className="mt-6 sm:mt-8">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan sm:mb-3 sm:text-xs">
                  Newsletter
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Your email"
                    className="flex-1 border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40"
                  />
                  <Button variant="default" size="icon">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:col-span-8 lg:gap-8">
            <div>
              <h4 className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 sm:mb-4 sm:text-xs">
                Shop
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {shopCategories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="text-xs text-white/60 transition-colors hover:text-cyan sm:text-sm"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/shop" className="text-xs text-cyan hover:underline sm:text-sm">
                    View All
                  </Link>
                </li>
              </ul>
            </div>

            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 sm:mb-4 sm:text-xs">
                  {category}
                </h4>
                <ul className="space-y-2 sm:space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs text-white/60 transition-colors hover:text-cyan sm:text-sm"
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:mt-20 sm:flex-row sm:pt-8">
          <p className="text-center text-[11px] text-white/40 sm:text-left sm:text-xs">
            &copy; {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, href, label }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/50 transition-all hover:border-cyan/40 hover:text-cyan sm:h-10 sm:w-10"
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
