"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Mountain } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { gbCities, images } from "@/lib/data";

function projectGBCoords(lat: number, lng: number) {
  const minLat = 34.8;
  const maxLat = 37.0;
  const minLng = 72.5;
  const maxLng = 77.0;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
  return { x: Math.min(95, Math.max(5, x)), y: Math.min(95, Math.max(5, y)) };
}

export function GlobalMapSection() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = gbCities.find((d) => d.id === activeId);

  return (
    <section id="locations" className="relative py-20 sm:py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Reach"
          title="Delivering Across Gilgit Baltistan"
          description="From Gilgit to Hunza, Skardu to Ghizer — we bring quality carpets and furniture to your doorstep."
          align="center"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto mt-8 aspect-[4/3] max-w-4xl overflow-hidden rounded-2xl glass-strong sm:mt-12 sm:aspect-[16/10] sm:rounded-3xl"
        >
          <Image
            src={images.sections.mapBg}
            alt="Gilgit Baltistan mountain landscape"
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-midnight/75 via-midnight/50 to-midnight/70" />

          <div className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(8,145,178,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg glass px-2.5 py-1.5 sm:left-4 sm:top-4 sm:px-3 sm:py-2">
            <Mountain className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gold sm:text-xs">Gilgit Baltistan</p>
              <p className="text-[10px] text-ivory/50 sm:text-xs">Pakistan</p>
            </div>
          </div>

          {gbCities.map((city, i) => {
            const { x, y } = projectGBCoords(city.lat, city.lng);
            return (
              <motion.button
                key={city.id}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring" }}
                onMouseEnter={() => setActiveId(city.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => setActiveId(activeId === city.id ? null : city.id)}
                className="absolute z-10"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                aria-label={city.name}
              >
                <motion.div animate={{ scale: activeId === city.id ? 1.4 : 1 }} className="relative">
                  <div className="h-2.5 w-2.5 rounded-full bg-gold shadow-lg shadow-gold/40 sm:h-3 sm:w-3" />
                  <motion.div
                    animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-gold/50"
                  />
                </motion.div>
              </motion.button>
            );
          })}

          {active && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-3 left-3 right-3 glass-strong rounded-xl px-3 py-2.5 sm:bottom-6 sm:left-6 sm:right-auto sm:px-4 sm:py-3"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />
                <span className="text-sm font-medium text-ivory">{active.name}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-ivory/50 sm:text-xs">
                {active.products}+ products · Delivery available
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
