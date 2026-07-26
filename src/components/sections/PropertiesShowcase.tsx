"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { products, formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const filters = ["All", "Carpets", "Sofas", "Curtains", "Beds", "Rugs"];

export function PropertiesShowcase() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [wishlist, setWishlist] = useState<string[]>([]);

  const filtered =
    activeFilter === "All"
      ? products
      : products.filter((p) => {
          const cat = activeFilter.toLowerCase();
          if (cat === "rugs") return p.category === "rug";
          if (cat === "carpets") return p.category === "carpet";
          if (cat === "sofas") return p.category === "sofa";
          if (cat === "curtains") return p.category === "curtain";
          if (cat === "beds") return p.category === "bed";
          return p.category.includes(cat.slice(0, -1));
        });

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <section id="products" className="relative py-20 sm:py-32 md:py-48">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-royal/[0.04] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Shop"
          title="Featured Products"
          description="Handpicked carpets, sofas, and furnishings — quality you can see and feel."
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
                  ? "gradient-gold font-medium text-midnight"
                  : "glass text-ivory/60 hover:text-ivory"
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
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[3/4]">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent" />

                {product.badge && (
                  <span className="absolute top-3 left-3 rounded-full border border-gold/40 bg-midnight/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-gold backdrop-blur-sm sm:top-4 sm:left-4 sm:px-3 sm:text-[10px]">
                    {product.badge}
                  </span>
                )}

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full glass transition-all hover:scale-110 sm:top-4 sm:right-4 sm:h-9 sm:w-9"
                  aria-label="Add to wishlist"
                >
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5 sm:h-4 sm:w-4",
                      wishlist.includes(product.id)
                        ? "fill-royal text-royal"
                        : "text-ivory/60"
                    )}
                  />
                </button>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <div className="translate-y-2 opacity-100 transition-all duration-500 group-hover:translate-y-0 sm:opacity-0 sm:group-hover:opacity-100">
                    <div className="glass-strong rounded-xl p-4">
                      <h3 className="font-display text-lg text-ivory sm:text-xl">{product.title}</h3>
                      <p className="mt-1 text-xs text-ivory/50 sm:text-sm">{product.location}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-base font-medium text-gold sm:text-lg">
                          {formatPrice(product.price)}
                        </span>
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          {product.rating}
                        </div>
                      </div>
                      <Button variant="gold" size="sm" className="mt-3 w-full">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>

                  {/* Always visible on mobile */}
                  <div className="mt-0 sm:hidden">
                    <h3 className="font-display text-lg text-ivory">{product.title}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gold">{formatPrice(product.price)}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-gold text-gold" />
                        {product.rating}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
