"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { images } from "@/lib/data";

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-midnight"
        >
          <div className="absolute inset-0">
            <Image
              src={images.sections.loading}
              alt="Handmade carpet detail"
              fill
              className="object-cover opacity-30"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-midnight/80" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 text-center"
          >
            <motion.h1
              className="font-display text-5xl font-light tracking-[0.15em] text-ivory sm:text-6xl md:text-8xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              LEXURY
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-3 text-xs uppercase tracking-[0.35em] text-gold"
            >
              Gilgit Baltistan
            </motion.p>
            <motion.div
              className="absolute -bottom-2 left-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="relative z-10 mt-8 text-xs uppercase tracking-[0.3em] text-ivory/40"
          >
            Carpets · Sofas · Home Furnishings
          </motion.p>

          <motion.div className="absolute bottom-12 z-10 h-[2px] w-40 overflow-hidden rounded-full bg-ivory/10 sm:w-48">
            <motion.div
              className="h-full gradient-gold"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.8, delay: 0.5, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
