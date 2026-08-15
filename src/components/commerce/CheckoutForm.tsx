"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CheckoutForm({ totals }: { totals: { totalMinor: number; subtotalMinor: number; deliveryMinor: number } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    line1: "",
    city: "",
    region: "",
    phone: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        shipping: {
          name: form.name,
          line1: form.line1,
          city: form.city,
          region: form.region,
          phone: form.phone,
        },
        notes: form.notes,
        fulfilmentType: "DELIVERY",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Checkout failed");
      return;
    }
    router.push(`/checkout/confirmation/${data.orderNumber}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4 rounded-xl border border-navy/10 bg-white p-6">
        <h2 className="font-medium text-navy">Delivery details</h2>
        <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input placeholder="Address line" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required />
        <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        <Input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <textarea
          placeholder="Order notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="min-h-[100px] w-full rounded-xl border border-navy/10 px-4 py-3 text-sm"
        />
        <p className="text-xs text-muted">Cash on delivery (COD) at launch. Online payment coming soon.</p>
      </div>
      <aside className="h-fit rounded-xl border border-navy/10 bg-white p-6">
        <h2 className="font-medium text-navy">Review</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>PKR {(totals.subtotalMinor / 100).toLocaleString()}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>PKR {(totals.deliveryMinor / 100).toLocaleString()}</dd></div>
          <div className="flex justify-between border-t border-navy/10 pt-2 font-medium">
            <dt>Total</dt><dd>PKR {(totals.totalMinor / 100).toLocaleString()}</dd>
          </div>
        </dl>
        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? "Placing order..." : "Place order (COD)"}
        </Button>
      </aside>
    </form>
  );
}
