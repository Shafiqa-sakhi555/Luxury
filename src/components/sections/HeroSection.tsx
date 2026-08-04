"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Search, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { TextReveal } from "@/components/shared/TextReveal";
import { categories } from "@/lib/categories";
import { stats, images } from "@/lib/data";
import { useLogoIntroSafe } from "@/contexts/LogoIntroContext";

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function CursorGlow() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 100, damping: 30 });
  const springY = useSpring(cursorY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="pointer-events-none fixed z-30 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 md:h-[500px] md:w-[500px]"
      style={{
        x: springX,
        y: springY,
        background:
          "radial-gradient(circle, rgba(36,28,107,0.14) 0%, rgba(59,111,224,0.1) 40%, rgba(41,196,232,0.06) 65%, transparent 75%)",
      }}
    />
  );
}

export function HeroSection() {
  const intro = useLogoIntroSafe();
  const d = intro?.skipIntro ? 0.35 : 2.7;

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-white">
      <CursorGlow />

      <div className="absolute inset-0">
        <Image
          src={images.hero}
          alt="Jalals Home Solution showroom interior"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/20 to-white/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/45 via-transparent to-white/75" />
      </div>

      <motion.div
        animate={{ y: [0, -16, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-blue/15 blur-[100px] md:h-96 md:w-96"
      />
      <motion.div
        animate={{ y: [0, 16, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 left-1/4 h-56 w-56 rounded-full bg-cyan/15 blur-[80px] md:h-80 md:w-80"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: d }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-red/25 bg-white/90 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-navy shadow-sm sm:mb-6">
            <MapPin className="h-3 w-3 text-red" />
            Gilgit-Baltistan, Pakistan
          </span>
        </motion.div>

        <div className="mt-2 sm:mt-4">
          <TextReveal
            as="h1"
            className="font-display text-4xl font-light leading-[1.08] tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl"
            delay={d + 0.2}
          >
            Premium Home Furnishings
          </TextReveal>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: d + 0.5 }}
          className="mx-auto mt-6 max-w-2xl px-2 text-sm leading-relaxed text-white/85 sm:mt-8 sm:text-base md:text-lg"
        >
          Carpets, rugs, furniture, flooring and decor — 13 categories with custom sizing
          and configuration. International quality, delivered across Pakistan.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: d + 0.7 }}
          className="mx-auto mt-8 max-w-3xl sm:mt-12"
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-navy/10 bg-white/95 p-3 shadow-xl shadow-navy/10 sm:gap-4 sm:p-4 md:flex-row md:items-center md:rounded-full md:p-2 md:pl-6">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
              <div className="flex flex-1 items-center gap-3 border-navy/10 px-3 sm:px-4 md:border-r">
                <Search className="h-4 w-4 shrink-0 text-red" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full min-w-0 bg-transparent text-sm text-navy placeholder:text-muted outline-none"
                />
              </div>
              <div className="flex flex-1 items-center gap-3 px-3 sm:px-4">
                <Tag className="h-4 w-4 shrink-0 text-red" />
                <select className="w-full bg-transparent text-sm text-navy/80 outline-none">
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <MagneticButton>
              <Button variant="default" size="lg" className="w-full md:w-auto md:rounded-full">
                <Search className="h-4 w-4" />
                Shop Now
              </Button>
            </MagneticButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: d + 1.1 }}
          className="mt-12 grid grid-cols-2 gap-4 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-md sm:mt-16 sm:gap-8 sm:p-6 md:grid-cols-4"
        >
          {stats.map((stat, i) => {
            const colors = ["text-red", "text-blue", "text-cyan", "text-navy"];
            return (
            <div key={stat.label} className="text-center">
              <p className={`font-display text-2xl font-light sm:text-3xl md:text-4xl ${colors[i % colors.length]}`}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-navy/70 sm:mt-2 sm:text-xs">
                {stat.label}
              </p>
            </div>
          );
          })}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: d + 1.7 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:bottom-8"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted">
            Explore
          </span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-red/70 via-blue/50 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
