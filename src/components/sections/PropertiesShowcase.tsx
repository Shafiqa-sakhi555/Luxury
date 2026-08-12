"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingCart, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { products, formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const filters = ["All", "Carpet", "Rugs", "Sofa", "Beds", "Decor"];

function salePercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}

export function PropertiesShowcase({
  initialFilter = "All",
  showViewAllLink = true,
}: {
  initialFilter?: string;
  showViewAllLink?: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const filtered =
    activeFilter === "All"
      ? products
      : products.filter((p) => {
          const cat = activeFilter.toLowerCase();
          return p.category.includes(cat.slice(0, -1)) || p.category === cat.slice(0, -1);
        });

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <section id="products" className="relative overflow-hidden section-brand-light py-16 sm:py-24">
      <div className="blob-red left-0 top-10 h-64 w-64 opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Weekly Bestsellers"
            title={showViewAllLink ? "Handpicked For Your Home" : "Shop Catalog"}
            description="Premium carpets, rugs, furniture and decor — curated deals with transparent pricing."
            className="mb-0"
          />
          {showViewAllLink && (
          <Link href="/shop" className="shrink-0">
            <Button variant="outline" size="lg">
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          )}
        </div>

        <div className="mb-8 mt-10 flex gap-2 overflow-x-auto pb-2 hide-scrollbar sm:mb-12 sm:flex-wrap sm:gap-3">
          {filters.map((filter) => (
            <motion.button
              key={filter}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs transition-all duration-300 sm:px-5 sm:text-sm",
                activeFilter === filter
                  ? "bg-red font-medium text-white shadow-md shadow-red/20"
                  : "border border-navy/10 bg-white text-navy/70 hover:border-red/30 hover:bg-red/5 hover:text-navy"
              )}
            >
              {filter}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {filtered.map((product, i) => {
            const discount = salePercent(product.price, product.compareAtPrice);

            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-navy/8 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-red/20"
              >
                <div className="relative aspect-square overflow-hidden bg-mist">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />

                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 sm:top-3 sm:left-3">
                    {discount && (
                      <span className="rounded-md bg-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        -{discount}%
                      </span>
                    )}
                    {product.badge && (
                      <span className="rounded-md bg-navy/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition-all hover:scale-110 sm:top-3 sm:right-3 sm:h-9 sm:w-9"
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      className={cn(
                        "h-3.5 w-3.5 sm:h-4 sm:w-4",
                        wishlist.includes(product.id)
                          ? "fill-red text-red"
                          : "text-navy/35"
                      )}
                    />
                  </button>

                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-white/95 p-3 backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0 sm:p-4">
                    <Button variant="default" size="sm" className="w-full">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-blue sm:text-[11px]">
                    {product.category}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-display text-sm leading-snug text-navy sm:text-base">
                    {product.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-muted sm:text-xs">{product.location}</p>

                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <div>
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-navy sm:text-base">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-[11px] text-muted line-through sm:text-xs">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-[11px] text-navy/70 sm:text-xs">
                      <Star className="h-3 w-3 fill-cyan text-cyan" />
                      {product.rating}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
