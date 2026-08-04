"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { founder, company } from "@/lib/content";

const milestones = [
  {
    year: "1980",
    title: "Murtazabad, Hunza",
    description:
      "Born on 16 March 1980, spending childhood learning resilience in modest circumstances.",
  },
  {
    year: "9000",
    title: "The Learning Years",
    description:
      "Began working in a small carpet and rug shop in Gilgit, learning the craft over five years.",
  },
  {
    year: "2005",
    title: "Jalal Carpets Founded",
    description:
      "Established first independent venture in Kashrot, Gilgit, specializing in rugs and carpets.",
  },
  {
    year: "2010s",
    title: "Pak Turk Carpets & Expansion",
    description:
      "Opened Pak Turk Carpets in Jutial, introducing premium Turkish rugs to the region.",
  },
  {
    year: "2020",
    title: "Jalal Home Solution",
    description:
      "Established presence in Aliabad, Hunza and opened the flagship showroom in Gilgit.",
  },
  {
    year: "2022",
    title: "Skardu & China Trade",
    description:
      "Opened Skardu branch and expanded operations internationally, establishing blanket manufacturing.",
  },
  {
    year: "2024",
    title: "Gakuch Branch",
    description:
      "Opened Gakuch branch, further cementing the brand's presence across Gilgit-Baltistan.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
};

const storyParagraphs = [
  "Success is often measured by wealth or recognition, but for Jalal Uddin, it has always been defined by perseverance, integrity, and an unwavering commitment to growth. His remarkable journey from humble beginnings to becoming one of Gilgit-Baltistan's most respected entrepreneurs is a story of resilience, vision, and relentless hard work.",
  "Born on 16 March 1980 in Murtazabad, Hunza, Jalal Uddin spent his childhood in modest circumstances. Growing up in poverty taught him the value of determination and resilience from an early age. Rather than allowing hardship to define his future, he chose to let it fuel his ambition to build a better life for himself, his family, and his community.",
  "In the early 2000s, Jalal began his professional journey by working alongside his uncle in a small carpet and rug business in Gilgit. Although he started as a helper, he approached every task as an opportunity to learn. Over five years, he gained practical experience, developed a deep understanding of the industry, and built the confidence needed to pursue his own entrepreneurial dream.",
  "In 2005, that dream became reality when he founded Jalal Carpets in Kashrot, Gilgit. Specializing in rugs and wall-to-wall carpets, the business quickly earned a reputation for quality products, honest dealings, and exceptional customer service.",
  "A defining milestone came when Venus Carpets, one of Pakistan's leading carpet suppliers based in Karachi, partnered with his business. Jalal consistently exceeded expectations, earning trust through dedication, reliability, and professionalism.",
  "After more than a decade of dedication, he expanded into the Jutial market by opening Pak Turk Carpets — carefully chosen to reflect the premium Turkish rugs that became one of the store's specialties.",
  "His expansion continued with Jalal Home Solution in Aliabad, Hunza, and the flagship showroom near the Appellate Court in Gilgit. For Jalal, expansion has never been solely about increasing outlets — it has been about bringing world-class home furnishing products closer to local communities.",
  "In 2022 he opened Pak Turk Carpets in Skardu and another branch in Gakuch in 2024. His ambitions reached beyond Pakistan's borders with trading rights in China, blanket manufacturing, and import-export operations spanning furniture, décor, and household products.",
  "Today, Jalal Uddin oversees a growing network of successful businesses while remaining true to the values that shaped his journey: honesty, hard work, innovation, and customer satisfaction. His story serves as an inspiration to aspiring entrepreneurs throughout Gilgit-Baltistan and beyond.",
];

export function AboutPageContent() {
  return (
    <>
      <div className="relative min-h-screen pt-28 sm:pt-36">
        <div className="absolute inset-x-0 top-0 h-64 gradient-brand-soft opacity-80" />
        <div className="blob-red right-10 top-20 h-64 w-64" />
        <div className="blob-blue left-0 top-40 h-72 w-72" />

        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16 sm:mb-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.span
              variants={itemVariants}
              className="eyebrow-pill"
            >
              Who We Are
            </motion.span>

            <motion.h1
              variants={itemVariants}
              className="mt-6 font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-none"
            >
              <span className="text-red">J</span>
              <span className="text-navy">alals Home Solution</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 mx-auto max-w-2xl text-sm sm:text-lg text-muted leading-relaxed font-light"
            >
              A premium, design-led home furnishings brand delivering international
              quality, craftsmanship, and elegance across Gilgit-Baltistan and Pakistan.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="brand-divider mx-auto mt-10"
            />
          </motion.div>
        </section>

        {/* Founder message + portrait */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 sm:mb-32 section-brand-alt py-16 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto w-full max-w-md lg:max-w-none"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-xl ring-1 ring-navy/10">
                <Image
                  src={founder.image}
                  alt={`${founder.name}, Founder of ${company.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/30 via-transparent to-transparent" />
              </div>
              <p className="mt-3 text-center text-[11px] text-muted italic lg:text-left">
                Sample portrait — replace with client-supplied photo
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red">
                Founder&apos;s Message
              </span>
              <h2 className="mt-3 font-display text-2xl sm:text-4xl font-light text-navy leading-tight">
                {founder.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{founder.title}</p>

              <div className="relative mt-8 overflow-hidden rounded-2xl border border-blue/15 bg-gradient-to-br from-white to-brand-50 p-8 shadow-lg shadow-blue/10 sm:p-10">
                <Quote className="absolute -top-2 right-6 h-10 w-10 text-red/20" />
                <p className="font-display text-xl sm:text-2xl md:text-3xl italic font-light leading-relaxed text-navy/90">
                  &ldquo;{founder.quote}&rdquo;
                </p>
                <div className="mt-6 pt-6 border-t border-navy/10">
                  <p className="text-sm font-medium text-navy">{founder.name}</p>
                  <p className="text-xs text-muted mt-1">{founder.company}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Full story */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-24 sm:mb-36">
          <div className="card-brand-tint p-8 sm:p-12">
          <SectionHeading
            eyebrow="Our History"
            title="The Visionary Behind Jalals"
            description="From a small carpet shop helper to one of Gilgit-Baltistan's leading home furnishing businesses."
          />

          <div className="space-y-6 text-sm sm:text-base leading-relaxed text-muted font-light">
            {storyParagraphs.map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="relative overflow-hidden section-brand px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-24 sm:mb-36 py-16 sm:py-20">
          <div className="blob-cyan -right-10 top-0 h-64 w-64" />

          <SectionHeading
            eyebrow="Milestones"
            title="The Journey at a Glance"
            align="center"
          />

          <div className="relative mt-12 sm:mt-16">
            <div className="absolute left-4 top-0 h-full w-[3px] rounded-full timeline-line md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-12">
              {milestones.map((milestone, i) => {
                const accents = [
                  "border-l-red from-red/10 to-white",
                  "border-l-blue from-blue/10 to-white",
                  "border-l-navy from-navy/10 to-white",
                  "border-l-cyan from-cyan/10 to-white",
                ];
                const accent = accents[i % accents.length];

                return (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={`relative flex flex-col md:flex-row items-start ${
                    i % 2 === 0 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="absolute left-4 top-6 h-4 w-4 -translate-x-[7px] rounded-full border-[3px] border-white bg-gradient-to-br from-red to-blue shadow-md z-20 md:left-1/2 md:-translate-x-1/2" />

                  <div className="w-full md:w-1/2 pl-10 md:pl-0 md:px-12">
                    <div
                      className={`card-brand border-l-4 bg-gradient-to-br p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 ${accent} ${
                        i % 2 === 0 ? "md:text-left md:border-l-0 md:border-r-4 md:border-r-red" : ""
                      }`}
                    >
                      <span className="inline-block rounded-full bg-red/10 px-3 py-1 text-sm font-semibold text-red tracking-wider">
                        {milestone.year}
                      </span>
                      <h3 className="mt-2 font-display text-lg font-light text-navy sm:text-xl">
                        {milestone.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed font-light">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block w-1/2" />
                </motion.div>
              );
              })}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
