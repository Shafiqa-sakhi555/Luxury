import { MapPin } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";

type AddressRow = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
  phone: string | null;
  is_default_shipping: boolean | null;
  is_default_billing: boolean | null;
};

export default async function AccountAddressesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let addresses: AddressRow[] = [];

  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (customer) {
      const { data } = await supabase
        .from("addresses")
        .select(
          "id, label, line1, line2, city, region, postal_code, phone, is_default_shipping, is_default_billing"
        )
        .eq("customer_id", customer.id)
        .order("is_default_shipping", { ascending: false });

      addresses = (data ?? []) as AddressRow[];
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-navy sm:text-3xl">Addresses</h2>
      <p className="mt-2 text-sm text-muted">
        Saved delivery addresses for faster checkout.
      </p>

      {addresses.length === 0 ? (
        <EmptyState
          className="mt-8 surface-card"
          icon={<MapPin className="h-6 w-6" />}
          title="No saved addresses"
          description="Your delivery address will be saved when you complete checkout. You can also add one during your next order."
          action={{ label: "Browse shop", href: "/shop" }}
        />
      ) : (
        <ul className="mt-8 space-y-4">
          {addresses.map((address) => (
            <li key={address.id}>
              <Card padding="md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">
                      {address.label ?? "Address"}
                      {address.is_default_shipping ? (
                        <span className="ml-2 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {[address.city, address.region, address.postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {address.phone ? (
                      <p className="mt-1 text-sm text-muted">{address.phone}</p>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
