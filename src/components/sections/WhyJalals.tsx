"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Shield, Award, Truck, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TimelineCard } from "@/components/shared/TimelineCard";
import { homeTimeline } from "@/lib/timeline";
import { images } from "@/lib/data";

const trustIndicators = [
  { icon: Shield, label: "Quality Guaranteed", value: 100, suffix: "%", accent: "text-red bg-red/10 ring-red/20" },
  { icon: Award, label: "Premium Designs", value: 950, suffix: "+", accent: "text-blue bg-blue/10 ring-blue/20" },
  { icon: Truck, label: "Showroom Locations", value: 5, suffix: "", accent: "text-navy bg-navy/10 ring-navy/15" },
  { icon: Sparkles, label: "Customer Rating", value: 4.9, suffix: "", accent: "text-cyan bg-cyan/10 ring-cyan/25" },
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
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end start"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 0.85], [0, 1]);

  return (
    <section className="relative overflow-hidden">
      {/* Intro — light professional band */}
      <div className="section-brand-light relative py-20 sm:py-28">
        <div className="blob-red -left-16 top-10 h-64 w-64 opacity-40" />
        <div className="blob-blue right-0 top-1/4 h-72 w-72 opacity-35" />

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
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl ring-1 ring-navy/10"
            >
              <Image
                src={images.sections.whyJalals}
                alt="Jalals showroom interior"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/10 to-transparent" />
              <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan sm:text-xs">
                  Our Showroom
                </p>
                <p className="mt-1 font-display text-2xl text-white sm:text-3xl">
                  Gilgit, Pakistan
                </p>
              </div>
            </motion.div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:mt-16 sm:gap-5 md:grid-cols-4">
            {trustIndicators.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.55 }}
                whileHover={{ y: -4 }}
                className="card-brand rounded-2xl p-5 text-center sm:p-6"
              >
                <div
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ring-1 sm:h-12 sm:w-12 ${item.accent}`}
                >
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="mt-4 font-display text-2xl font-light text-navy sm:text-3xl">
                  <Counter target={item.value} suffix={item.suffix} />
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted sm:text-xs">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline — soft navy-tinted professional band */}
      <div
        ref={timelineRef}
        className="section-timeline relative py-20 sm:py-28"
      >
        <div className="absolute inset-x-0 top-0 brand-accent-bar" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Journey"
            title="Milestones That Shaped Us"
            description="From a single carpet shop to Gilgit-Baltistan's leading home furnishing brand."
            align="center"
            className="mb-14 sm:mb-16"
          />

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 hidden w-[3px] overflow-hidden rounded-full bg-navy/10 md:left-1/2 md:-translate-x-1/2 md:block">
              <motion.div
                style={{ scaleY: lineScale, originY: 0 }}
                className="h-full w-full timeline-line"
              />
            </div>

            {homeTimeline.map((item, i) => (
              <div
                key={item.year}
                className={`relative mb-14 pl-10 sm:mb-16 md:mb-20 md:w-[calc(50%-2.5rem)] md:pl-0 ${
                  i % 2 === 0 ? "md:mr-auto md:pr-10" : "md:ml-auto md:pl-10"
                }`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className={`absolute top-8 z-10 h-4 w-4 rounded-full border-[3px] border-white bg-gradient-to-br from-red to-blue shadow-md md:top-10 ${
                    i % 2 === 0
                      ? "left-0 md:-right-[10px] md:left-auto"
                      : "left-0 md:-left-[10px]"
                  }`}
                />

                <TimelineCard
                  item={item}
                  index={i}
                  align={i % 2 === 0 ? "right" : "left"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
