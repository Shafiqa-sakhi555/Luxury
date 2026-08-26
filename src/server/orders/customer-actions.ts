"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cancelCustomerOrder } from "@/server/orders";

export async function cancelCustomerOrderAction(input: { orderId: string }) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return { ok: false as const, error: "Please sign in to cancel this order." };
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!customer?.id) {
      return { ok: false as const, error: "Order not found." };
    }

    await cancelCustomerOrder({
      orderId: input.orderId,
      customerId: customer.id,
      customerUserId: user.id,
    });

    revalidatePath("/account");
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${input.orderId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.orderId}`);

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not cancel this order.",
    };
  }
}
