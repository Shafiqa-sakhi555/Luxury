import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/server/db";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const customerRole = await db.role.upsert({
      where: { name: "Customer" },
      update: {},
      create: { name: "Customer", description: "Storefront customer" },
    });

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await db.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
        userRoles: { create: { roleId: customerRole.id } },
        customer: {
          create: {
            wishlist: { create: {} },
          },
        },
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
