"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/sections/ContactForm";
import { BranchesSection } from "@/components/sections/BranchesSection";
import { company } from "@/lib/content";
import { branches, TOTAL_BRANCHES } from "@/lib/branches";

export function ContactPageContent() {
  return (
    <>
      <div className="relative min-h-screen pt-28 sm:pt-36">
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-red sm:text-xs">
              Get in Touch
            </span>
            <h1 className="mt-4 font-display text-4xl font-light tracking-tight text-navy sm:text-5xl md:text-6xl">
              Contact Us
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Visit any of our {TOTAL_BRANCHES} branches across Gilgit-Baltistan,
              call your nearest branch office, or send us a message — we&apos;re happy to help
              with products, custom orders, and delivery.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                icon: Phone,
                label: "Management",
                value: "0313 5205272",
                href: "tel:+923135205272",
              },
              {
                icon: Mail,
                label: "Email",
                value: company.email,
                href: `mailto:${company.email}`,
              },
              {
                icon: MapPin,
                label: "Branches & Operations",
                value: `${TOTAL_BRANCHES} branches in GB`,
                href: "#branches",
              },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-4 rounded-2xl border border-navy/5 bg-white p-5 shadow-sm transition-all hover:border-red/20 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red/8">
                  <item.icon className="h-5 w-5 text-red" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">{item.label}</p>
                  <p className="text-sm font-medium text-navy">{item.value}</p>
                </div>
              </a>
            ))}
          </motion.div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12 sm:mb-16">
          <div className="rounded-2xl border border-navy/8 bg-luxury-cream p-6 sm:p-8">
            <h2 className="font-display text-2xl font-light text-navy sm:text-3xl">
              Branches &amp; Operations
            </h2>
            <p className="mt-2 text-sm text-muted">
              Total branches: {TOTAL_BRANCHES} · Select a location below for map directions and contact numbers.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <a
                  key={branch.id}
                  href="#branches"
                  className="rounded-xl border border-navy/8 bg-white p-4 transition-all hover:border-red/25 hover:shadow-md"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red">
                    {branch.brandLabel}
                  </p>
                  <p className="mt-1 font-display text-lg text-navy">{branch.name}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{branch.address}</p>
                  <ul className="mt-3 space-y-1 border-t border-navy/5 pt-3">
                    {branch.contacts.map((contact) => (
                      <li key={contact.label} className="flex justify-between gap-2 text-xs">
                        <span className="text-muted">{contact.label}</span>
                        <span className="font-medium text-navy">{contact.phoneDisplay}</span>
                      </li>
                    ))}
                  </ul>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 sm:mb-28">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="font-display text-2xl font-light text-navy sm:text-3xl">
                Send a Message
              </h2>
              <p className="mt-3 text-sm text-muted">
                Custom carpet sizes, furniture configuration, delivery to your city —
                tell us what you need and we&apos;ll respond within one working day.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            <div className="rounded-2xl border border-navy/5 bg-mist p-6 sm:p-8">
              <h2 className="font-display text-2xl font-light text-navy sm:text-3xl">
                Quick Contact
              </h2>
              <p className="mt-3 text-sm text-muted">
                Prefer to talk directly? Call the branch nearest to you.
              </p>
              <ul className="mt-6 space-y-4">
                {branches.map((branch) => (
                  <li
                    key={branch.id}
                    className="rounded-xl border border-navy/5 bg-white p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-red">
                      {branch.brandLabel}
                    </p>
                    <p className="mt-1 font-medium text-navy">
                      {branch.name} — {branch.city}
                    </p>
                    <div className="mt-2 space-y-1">
                      {branch.contacts.map((contact) => (
                        <p key={contact.label} className="text-xs text-muted">
                          <span className="font-medium text-navy/80">{contact.label}:</span>{" "}
                          <a href={`tel:${contact.phone}`} className="hover:text-red">
                            {contact.phoneDisplay}
                          </a>
                        </p>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <BranchesSection />
      <Footer />
    </>
  );
}
