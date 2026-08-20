import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureCustomerForProfile, resolveCustomerCart } from "@/server/cart";

export type AssistantUserContext = {
  userId: string | null;
  customerId: string | null;
  email: string | null;
  name: string | null;
  isAuthenticated: boolean;
};

export async function resolveAssistantUserContext(): Promise<AssistantUserContext> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        userId: null,
        customerId: null,
        email: null,
        name: null,
        isAuthenticated: false,
      };
    }

    const customerId = await resolveCustomerCart(user.id);
    const name =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null;

    return {
      userId: user.id,
      customerId,
      email: user.email ?? null,
      name,
      isAuthenticated: true,
    };
  } catch {
    return {
      userId: null,
      customerId: null,
      email: null,
      name: null,
      isAuthenticated: false,
    };
  }
}

export async function resolveGuestCustomerId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return ensureCustomerForProfile(user.id);
  } catch {
    return null;
  }
}
