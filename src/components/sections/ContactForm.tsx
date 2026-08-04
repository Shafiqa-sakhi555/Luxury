"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { branches } from "@/lib/branches";
import { company } from "@/lib/content";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder — wire to API / email service in a later phase
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-navy/5 bg-mist p-10 text-center"
      >
        <CheckCircle2 className="h-12 w-12 text-emerald" />
        <h3 className="mt-4 font-display text-2xl text-navy">Message Sent</h3>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Thank you for reaching out. Our team will get back to you within one
          working day.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setSubmitted(false)}
        >
          Send Another Message
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
            Full Name
          </label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
            Phone
          </label>
          <Input id="phone" name="phone" type="tel" required placeholder="03XX XXXXXXX" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
          Email
        </label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" />
      </div>

      <div>
        <label htmlFor="branch" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
          Nearest Branch
        </label>
        <select
          id="branch"
          name="branch"
          className="flex h-11 w-full rounded-xl border border-navy/10 bg-white px-4 py-2 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-violet/30"
        >
          <option value="">Select a branch (optional)</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.brandLabel} — {b.name}, {b.city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
          Subject
        </label>
        <Input id="subject" name="subject" required placeholder="Custom order, delivery, product enquiry..." />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what you're looking for..."
          className="flex w-full resize-none rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-violet/30"
        />
      </div>

      <Button type="submit" variant="default" size="lg" className="w-full sm:w-auto" disabled={loading}>
        {loading ? "Sending..." : "Send Message"}
        <Send className="h-4 w-4" />
      </Button>

      <p className="text-[11px] text-muted">
        Or call us directly at{" "}
        <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="text-red hover:underline">
          {company.phone}
        </a>{" "}
        or email{" "}
        <a href={`mailto:${company.email}`} className="text-red hover:underline">
          {company.email}
        </a>
      </p>
    </form>
  );
}
