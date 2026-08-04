"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
import { useLogoIntro } from "@/contexts/LogoIntroContext";

export function LogoIntroOverlay() {
  const { phase, skipIntro } = useLogoIntro();

  if (skipIntro) return null;

  return (
    <AnimatePresence>
      {(phase === "splash" || phase === "exit") && (
        <motion.div
          key="intro-backdrop"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "exit" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-0 z-[9998] bg-white"
        >
          <div className="absolute inset-0 gradient-brand-soft" />
          <div className="blob-red left-1/4 top-1/4 h-64 w-64 opacity-60" />
          <div className="blob-blue right-1/4 bottom-1/4 h-72 w-72 opacity-60" />
        </motion.div>
      )}

      {phase === "splash" && (
        <motion.div
          key="intro-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <BrandLogo size="splash" layoutId priority />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-6 sm:mt-8"
            >
              <BrandWordmark />
              <motion.div
                className="brand-divider mx-auto mt-4"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 96, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.45 }}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="mt-3 text-xs uppercase tracking-[0.28em] text-muted"
              >
                Premium Home Furnishings
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
