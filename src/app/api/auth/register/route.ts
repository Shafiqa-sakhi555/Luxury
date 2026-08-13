import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase();

    const cookieStore = await cookies()
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.signUp({
      email,
      password: body.password,
      options: {
        data: {
          full_name: body.name,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.user?.id, email: data.user?.email }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
