"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { products, formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const filters = ["All", "Carpet", "Rugs", "Sofa", "Beds", "Decor"];

export function PropertiesShowcase() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [wishlist, setWishlist] = useState<string[]>([]);

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
    <section id="products" className="relative overflow-hidden bg-white py-20 sm:py-32">
      <div className="absolute inset-0 gradient-brand-soft opacity-60" />
      <div className="blob-blue right-10 top-20 h-72 w-72 opacity-70" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Shop"
          title="Featured Products"
          description="Handpicked items from our catalog — sample products until the full inventory is loaded."
        />

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 hide-scrollbar sm:mb-12 sm:flex-wrap sm:gap-3">
          {filters.map((filter) => (
            <motion.button
              key={filter}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs transition-all duration-300 sm:px-5 sm:text-sm",
                activeFilter === filter
                  ? "bg-red font-medium text-white shadow-md shadow-red/20"
                  : "border border-blue/20 bg-white text-navy/70 hover:border-red/30 hover:bg-red/5 hover:text-navy"
              )}
            >
              {filter}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist ring-1 ring-navy/5 sm:aspect-[3/4]">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />

                {product.badge && (
                  <span className="absolute top-3 left-3 rounded-full bg-red px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white sm:top-4 sm:left-4 sm:px-3 sm:text-[10px]">
                    {product.badge}
                  </span>
                )}

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110 sm:top-4 sm:right-4 sm:h-9 sm:w-9"
                  aria-label="Add to wishlist"
                >
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5 sm:h-4 sm:w-4",
                      wishlist.includes(product.id)
                        ? "fill-red text-red"
                        : "text-navy/40"
                    )}
                  />
                </button>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 via-navy/50 to-transparent p-4 sm:p-6">
                  <h3 className="font-display text-lg text-white sm:text-xl">{product.title}</h3>
                  <p className="mt-1 text-xs text-white/70 sm:text-sm">{product.location}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-base font-medium text-white sm:text-lg">
                      {formatPrice(product.price)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-white/90 sm:text-sm">
                      <Star className="h-3.5 w-3.5 fill-cyan text-cyan" />
                      {product.rating}
                    </div>
                  </div>
                  <Button variant="default" size="sm" className="mt-3 w-full opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
