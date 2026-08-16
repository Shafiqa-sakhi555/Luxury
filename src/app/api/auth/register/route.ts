import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function mapRegistrationError(message: string, status?: number) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("duplicate") ||
    status === 422
  ) {
    return { message: "An account with this email already exists. Please sign in.", status: 409 };
  }

  if (normalized.includes("invalid") && normalized.includes("email")) {
    return {
      message: "Enter a valid email address.",
      status: 400,
    };
  }

  return { message, status: 400 };
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    const name = body.name.trim();
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name,
        full_name: name,
      },
      app_metadata: {
        role: "Customer",
      },
    });

    if (error || !data.user) {
      const mapped = mapRegistrationError(error?.message ?? "Registration failed.", error?.status);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", data.user.id)
      .maybeSingle();

    if (!existingCustomer) {
      const { error: customerError } = await supabase.from("customers").insert({
        profile_id: data.user.id,
      });

      if (customerError) {
        await supabase.auth.admin.deleteUser(data.user.id).catch(() => undefined);
        return NextResponse.json(
          { error: "Could not finish setting up your account. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ id: data.user.id, email: data.user.email }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
