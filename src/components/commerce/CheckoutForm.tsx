"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type CheckoutLineItem = {
  id: string;
  name: string;
  slug?: string;
  image: string;
  quantity: number;
  unitPriceMinor: number;
  sku?: string;
};

type PaymentMethod = "card" | "cod";
type BillingMode = "same" | "different";

const inputClassName =
  "h-11 rounded-lg border-neutral-300 bg-white text-sm shadow-none focus-visible:ring-neutral-400";

const selectClassName =
  "flex h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400";

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-neutral-700">
      {children}
    </label>
  );
}

function HelpIcon() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400 text-[10px] text-neutral-500">
      <HelpCircle className="h-3 w-3" aria-hidden />
    </span>
  );
}

export function CheckoutForm({
  totals,
  lineItems,
  userEmail,
}: {
  totals: { totalMinor: number; subtotalMinor: number; deliveryMinor: number };
  lineItems: CheckoutLineItem[];
  userEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [billingMode, setBillingMode] = useState<BillingMode>("same");
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [form, setForm] = useState({
    email: userEmail,
    firstName: "",
    lastName: "",
    line1: "",
    line2: "",
    city: "",
    postal: "",
    phone: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    cardName: "",
    billingFirstName: "",
    billingLastName: "",
    billingLine1: "",
    billingLine2: "",
    billingCity: "",
    billingPostal: "",
    billingPhone: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (paymentMethod === "card") {
      toast.error("Online payment is coming soon. Please choose Cash on Delivery.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        shipping: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          region: "Pakistan",
          postal: form.postal || undefined,
          phone: form.phone,
        },
        paymentMethod: "COD",
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

  const shippingLabel = totals.deliveryMinor === 0 ? "Free Shipping" : "Standard delivery";
  const submitLabel = paymentMethod === "card" ? "Pay now" : "Complete order";

  return (
    <div className="grid lg:min-h-[calc(100vh-4.25rem)] lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)]">
      <div className="border-b border-neutral-200 px-4 py-8 sm:px-6 lg:border-b-0 lg:border-r lg:px-10 lg:py-10 xl:px-16">
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-8">
          <section>
            <SectionHeading
              title="Contact"
              action={
                !userEmail ? (
                  <Link href="/login?callbackUrl=/checkout" className="text-sm text-navy hover:underline">
                    Sign in
                  </Link>
                ) : null
              }
            />
            <FieldLabel htmlFor="checkout-email">Email</FieldLabel>
            <div className="relative">
              <Input
                id="checkout-email"
                type="email"
                autoComplete="email"
                className={inputClassName}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <HelpIcon />
              </span>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Email me with news and offers
            </label>
          </section>

          <section>
            <SectionHeading title="Delivery" />
            <div className="space-y-3">
              <div>
                <FieldLabel htmlFor="checkout-country">Country/Region</FieldLabel>
                <select id="checkout-country" className={selectClassName} defaultValue="PK" disabled>
                  <option value="PK">Pakistan</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="checkout-first-name">First name</FieldLabel>
                  <Input
                    id="checkout-first-name"
                    autoComplete="given-name"
                    className={inputClassName}
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="checkout-last-name">Last name</FieldLabel>
                  <Input
                    id="checkout-last-name"
                    autoComplete="family-name"
                    className={inputClassName}
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="checkout-line1">Address</FieldLabel>
                <Input
                  id="checkout-line1"
                  autoComplete="address-line1"
                  className={inputClassName}
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="checkout-line2">Apartment, suite, etc. (optional)</FieldLabel>
                <Input
                  id="checkout-line2"
                  autoComplete="address-line2"
                  className={inputClassName}
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                <div>
                  <FieldLabel htmlFor="checkout-city">City</FieldLabel>
                  <Input
                    id="checkout-city"
                    autoComplete="address-level2"
                    className={inputClassName}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="checkout-postal">Postal code (optional)</FieldLabel>
                  <Input
                    id="checkout-postal"
                    autoComplete="postal-code"
                    className={inputClassName}
                    value={form.postal}
                    onChange={(e) => setForm({ ...form, postal: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="checkout-phone">Phone</FieldLabel>
                <div className="relative">
                  <Input
                    id="checkout-phone"
                    type="tel"
                    autoComplete="tel"
                    className={inputClassName}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <HelpIcon />
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Save this information for next time
              </label>
            </div>
          </section>

          <section>
            <SectionHeading title="Shipping method" />
            <div className="flex items-center justify-between rounded-lg border border-neutral-900 bg-neutral-50 px-4 py-3 text-sm">
              <span>{shippingLabel}</span>
              <span className="font-medium uppercase tracking-wide">
                {totals.deliveryMinor === 0 ? "Free" : formatMoney(totals.deliveryMinor)}
              </span>
            </div>
          </section>

          <section>
            <SectionHeading title="Payment" />
            <p className="mb-4 text-sm text-neutral-600">All transactions are secure and encrypted.</p>
            <div className="overflow-hidden rounded-lg border border-neutral-300">
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 border-b border-neutral-300 px-4 py-3",
                  paymentMethod === "card" && "bg-neutral-50"
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Credit card</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide text-neutral-700">
                  <span className="rounded border border-neutral-300 px-1.5 py-0.5">VISA</span>
                  <span className="rounded border border-neutral-300 px-1.5 py-0.5">MC</span>
                </span>
              </label>

              {paymentMethod === "card" ? (
                <div className="space-y-3 border-b border-neutral-300 bg-neutral-50 px-4 py-4">
                  <div>
                    <FieldLabel htmlFor="checkout-card-number">Card number</FieldLabel>
                    <div className="relative">
                      <Input
                        id="checkout-card-number"
                        autoComplete="cc-number"
                        placeholder="Card number"
                        className={inputClassName}
                        value={form.cardNumber}
                        onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                      />
                      <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="checkout-card-expiry">Expiration date (MM / YY)</FieldLabel>
                      <Input
                        id="checkout-card-expiry"
                        autoComplete="cc-exp"
                        placeholder="Expiration date (MM / YY)"
                        className={inputClassName}
                        value={form.cardExpiry}
                        onChange={(e) => setForm({ ...form, cardExpiry: e.target.value })}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="checkout-card-cvc">Security code</FieldLabel>
                      <div className="relative">
                        <Input
                          id="checkout-card-cvc"
                          autoComplete="cc-csc"
                          placeholder="Security code"
                          className={inputClassName}
                          value={form.cardCvc}
                          onChange={(e) => setForm({ ...form, cardCvc: e.target.value })}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                          <HelpIcon />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <FieldLabel htmlFor="checkout-card-name">Name on card</FieldLabel>
                    <Input
                      id="checkout-card-name"
                      autoComplete="cc-name"
                      className={inputClassName}
                      value={form.cardName}
                      onChange={(e) => setForm({ ...form, cardName: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={useShippingAsBilling}
                      onChange={(e) => setUseShippingAsBilling(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    Use shipping address as billing address
                  </label>
                </div>
              ) : null}

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 px-4 py-3",
                  paymentMethod === "cod" && "bg-neutral-50"
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium">Cash on Delivery (COD)</span>
                  {paymentMethod === "cod" ? (
                    <span className="mt-2 block text-sm text-neutral-600">Pay cash upon delivery</span>
                  ) : null}
                </span>
              </label>
            </div>
          </section>

          {paymentMethod === "cod" ? (
            <section>
              <SectionHeading title="Billing address" />
              <div className="overflow-hidden rounded-lg border border-neutral-300">
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border-b border-neutral-300 px-4 py-3",
                    billingMode === "same" && "bg-neutral-50 ring-1 ring-inset ring-neutral-900"
                  )}
                >
                  <input
                    type="radio"
                    name="billing"
                    checked={billingMode === "same"}
                    onChange={() => setBillingMode("same")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Same as shipping address</span>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-4 py-3",
                    billingMode === "different" && "bg-neutral-50 ring-1 ring-inset ring-neutral-900"
                  )}
                >
                  <input
                    type="radio"
                    name="billing"
                    checked={billingMode === "different"}
                    onChange={() => setBillingMode("different")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Use a different billing address</span>
                </label>

                {billingMode === "different" ? (
                  <div className="space-y-3 border-t border-neutral-300 bg-neutral-50 px-4 py-4">
                    <div>
                      <FieldLabel htmlFor="billing-country">Country/Region</FieldLabel>
                      <select id="billing-country" className={selectClassName} defaultValue="PK" disabled>
                        <option value="PK">Pakistan</option>
                      </select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="billing-first-name">First name</FieldLabel>
                        <Input
                          id="billing-first-name"
                          className={inputClassName}
                          value={form.billingFirstName}
                          onChange={(e) => setForm({ ...form, billingFirstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="billing-last-name">Last name</FieldLabel>
                        <Input
                          id="billing-last-name"
                          className={inputClassName}
                          value={form.billingLastName}
                          onChange={(e) => setForm({ ...form, billingLastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel htmlFor="billing-line1">Address</FieldLabel>
                      <Input
                        id="billing-line1"
                        className={inputClassName}
                        value={form.billingLine1}
                        onChange={(e) => setForm({ ...form, billingLine1: e.target.value })}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="billing-line2">Apartment, suite, etc. (optional)</FieldLabel>
                      <Input
                        id="billing-line2"
                        className={inputClassName}
                        value={form.billingLine2}
                        onChange={(e) => setForm({ ...form, billingLine2: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                      <div>
                        <FieldLabel htmlFor="billing-city">City</FieldLabel>
                        <Input
                          id="billing-city"
                          className={inputClassName}
                          value={form.billingCity}
                          onChange={(e) => setForm({ ...form, billingCity: e.target.value })}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="billing-postal">Postal code (optional)</FieldLabel>
                        <Input
                          id="billing-postal"
                          className={inputClassName}
                          value={form.billingPostal}
                          onChange={(e) => setForm({ ...form, billingPostal: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel htmlFor="billing-phone">Phone (optional)</FieldLabel>
                      <div className="relative">
                        <Input
                          id="billing-phone"
                          type="tel"
                          className={inputClassName}
                          value={form.billingPhone}
                          onChange={(e) => setForm({ ...form, billingPhone: e.target.value })}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                          <HelpIcon />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="h-14 w-full rounded-lg bg-neutral-900 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {loading ? "Processing..." : submitLabel}
            </button>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
              <Link href="/delivery" className="underline hover:text-ink">
                Refund policy
              </Link>
              <Link href="/contact" className="underline hover:text-ink">
                Privacy policy
              </Link>
      </div>
            <p className="text-sm text-neutral-600">
              <Link href="/cart" className="text-navy hover:underline">
                Back to cart
              </Link>
            </p>
          </div>
        </form>
      </div>

      <aside className="bg-neutral-100 px-4 py-8 sm:px-6 lg:px-10 lg:py-10 xl:px-12">
        <div className="mx-auto max-w-md lg:sticky lg:top-8">
          <ul className="space-y-4">
            {lineItems.map((item) => (
              <li key={item.id} className="flex gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-600 px-1 text-[11px] font-medium text-white">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  {item.slug ? (
                    <Link href={`/products/${item.slug}`} className="text-sm font-medium text-ink hover:underline">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                  )}
                  {item.sku ? <p className="mt-0.5 text-xs text-neutral-500">{item.sku}</p> : null}
                </div>
                <p className="text-sm font-medium text-ink">
                  {formatMoney(item.unitPriceMinor * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-neutral-300 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{formatMoney(totals.subtotalMinor)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd>{totals.deliveryMinor === 0 ? "Free" : formatMoney(totals.deliveryMinor)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-300 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>
                <span className="mr-2 text-xs font-normal uppercase tracking-wide text-neutral-500">PKR</span>
                {formatMoney(totals.totalMinor).replace(/^Rs\.?\s?/, "")}
              </dd>
          </div>
        </dl>
        </div>
      </aside>
    </div>
  );
}
