"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Shield, Award, Truck, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { images } from "@/lib/data";

const timeline = [
  {
    year: "2005",
    title: "Jalal Carpets Founded",
    description: "First independent venture in Kashrot, Gilgit — specializing in rugs and carpets.",
    accent: "from-red/10 to-red/5 border-red/20",
  },
  {
    year: "2010s",
    title: "Pak Turk Carpets",
    description: "Expanded to Jutial with premium Turkish rugs and international partnerships.",
    accent: "from-blue/10 to-blue/5 border-blue/20",
  },
  {
    year: "2020",
    title: "Jalal Home Solution",
    description: "Flagship showroom opened in Gilgit — full home furnishing range.",
    accent: "from-navy/10 to-navy/5 border-navy/20",
  },
  {
    year: "2026",
    title: "Digital Storefront",
    description: "1,000+ products across 13 categories with online customization.",
    accent: "from-cyan/10 to-cyan/5 border-cyan/30",
  },
];

const trustIndicators = [
  { icon: Shield, label: "Quality Guaranteed", value: 100, suffix: "%", color: "bg-red/10 text-red" },
  { icon: Award, label: "Premium Designs", value: 950, suffix: "+", color: "bg-blue/10 text-blue" },
  { icon: Truck, label: "Showroom Locations", value: 6, suffix: "", color: "bg-navy/10 text-navy" },
  { icon: Sparkles, label: "Customer Rating", value: 4.9, suffix: "", color: "bg-cyan/10 text-cyan" },
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

export function WhyJalals() {
  return (
    <section className="relative overflow-hidden section-brand-alt py-20 sm:py-32">
      <div className="blob-red -left-20 top-20 h-72 w-72" />
      <div className="blob-blue right-0 top-1/3 h-80 w-80" />
      <div className="blob-cyan -bottom-10 left-1/3 h-64 w-64" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Why Jalals"
            title="Trusted For Premium Homes"
            description="We combine exquisite craftsmanship with modern designs — making every space elegant, functional, and uniquely yours."
            className="mb-0"
          />

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl shadow-navy/15 ring-2 ring-blue/20 sm:rounded-3xl"
          >
            <Image
              src={images.sections.whyJalals}
              alt="Jalals showroom interior"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan sm:text-xs">Our Showroom</p>
              <p className="mt-1 font-display text-xl text-white sm:text-2xl">Gilgit, Pakistan</p>
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
              className="card-brand p-4 text-center sm:p-6"
            >
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12 ${item.color}`}>
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <p className="mt-3 font-display text-2xl font-light text-navy sm:mt-4 sm:text-3xl md:text-4xl">
                <Counter target={item.value} suffix={item.suffix} />
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted sm:mt-2 sm:text-xs">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-12 sm:mt-16">
          <div className="absolute left-4 top-0 hidden h-full w-[3px] rounded-full timeline-line md:left-1/2 md:-translate-x-1/2 md:block" />

          {timeline.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative mb-10 pl-10 sm:mb-16 md:mb-20 md:w-1/2 md:pl-0 ${
                i % 2 === 0 ? "md:mr-auto md:pr-12 md:text-right" : "md:ml-auto md:pl-12"
              }`}
            >
              <div
                className={`card-brand border-l-4 border-l-red bg-gradient-to-br p-5 sm:p-6 ${item.accent} md:border-l-0 ${
                  i % 2 === 0 ? "md:border-r-4 md:border-r-red" : "md:border-l-4 md:border-l-red"
                }`}
              >
                <span className="inline-block rounded-full bg-red/10 px-3 py-1 text-xs font-semibold text-red">
                  {item.year}
                </span>
                <h3 className="mt-3 font-display text-xl font-light text-navy sm:text-2xl md:text-3xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:mt-3">
                  {item.description}
                </p>
              </div>

              <div className="absolute left-0 top-6 h-4 w-4 rounded-full border-[3px] border-white bg-gradient-to-br from-red to-blue shadow-md md:hidden" />
              <div
                className={`absolute top-8 hidden h-4 w-4 rounded-full border-[3px] border-white bg-gradient-to-br from-red to-cyan shadow-md md:block ${
                  i % 2 === 0 ? "md:-right-[9px]" : "md:-left-[9px]"
                }`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
