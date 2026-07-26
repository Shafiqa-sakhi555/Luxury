"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Shield, Award, Truck, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { images } from "@/lib/data";

const timeline = [
  {
    year: "2015",
    title: "Started in Gilgit",
    description: "Lexury began as a small carpet shop in Gilgit city, serving local families.",
  },
  {
    year: "2019",
    title: "Expanded Across GB",
    description: "Opened showrooms in Hunza, Skardu, and Ghizer with full furniture range.",
  },
  {
    year: "2023",
    title: "Online Store Launch",
    description: "Customers across Pakistan can now browse and order carpets & sofas online.",
  },
  {
    year: "2026",
    title: "GB's Trusted Brand",
    description: "950+ products, 4,200+ happy customers, and delivery across Gilgit Baltistan.",
  },
];

const trustIndicators = [
  { icon: Shield, label: "Quality Guaranteed", value: 100, suffix: "%" },
  { icon: Award, label: "Handmade Items", value: 500, suffix: "+" },
  { icon: Truck, label: "GB Delivery", value: 6, suffix: " Cities" },
  { icon: Sparkles, label: "Customer Rating", value: 4.9, suffix: "" },
];

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const isDecimal = !Number.isInteger(target);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target, isDecimal]);

  return (
    <span ref={ref}>
      {isDecimal ? count.toFixed(1) : count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function WhyLexury() {
  return (
    <section className="relative py-20 sm:py-32 md:py-48">
      <div className="absolute inset-0 bg-gradient-to-b from-violet/[0.04] via-transparent to-gold/[0.03]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Why Lexury"
            title="Trusted Across Gilgit Baltistan"
            description="We combine traditional craftsmanship with modern designs — making every home warm, beautiful, and uniquely yours."
            className="mb-0 lg:mb-0"
          />

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:rounded-3xl"
          >
            <Image
              src={images.sections.whyLexury}
              alt="Lexury furniture showroom interior"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold sm:text-xs">Our Showroom</p>
              <p className="mt-1 font-display text-xl text-ivory sm:text-2xl">Gilgit City, GB</p>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-6 md:grid-cols-4">
          {trustIndicators.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-strong rounded-xl p-4 text-center sm:rounded-2xl sm:p-6"
            >
              <item.icon className="mx-auto h-5 w-5 text-gold sm:h-6 sm:w-6" />
              <p className="mt-3 font-display text-2xl font-light text-ivory sm:mt-4 sm:text-3xl md:text-4xl">
                <Counter target={item.value} suffix={item.suffix} />
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-ivory/45 sm:mt-2 sm:text-xs sm:tracking-[0.15em]">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-12 sm:mt-16">
          <div className="absolute left-4 top-0 hidden h-full w-[1px] bg-gradient-to-b from-royal/40 via-gold/40 to-transparent md:left-1/2 md:block" />

          {timeline.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative mb-10 pl-10 sm:mb-16 md:mb-24 md:w-1/2 md:pl-0 ${
                i % 2 === 0 ? "md:mr-auto md:pr-12 md:text-right" : "md:ml-auto md:pl-12"
              }`}
            >
              <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-gold bg-midnight md:hidden" />
              <div
                className={`absolute top-2 hidden h-3 w-3 rounded-full border-2 border-gold bg-midnight md:block ${
                  i % 2 === 0 ? "md:-right-[6.5px]" : "md:-left-[6.5px]"
                }`}
              />
              <span className="text-sm font-medium text-gold">{item.year}</span>
              <h3 className="mt-2 font-display text-xl font-light text-ivory sm:text-2xl md:text-3xl">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/55 sm:mt-3">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
