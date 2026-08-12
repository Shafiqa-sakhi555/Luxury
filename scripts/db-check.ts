import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const categories = await db.category.findMany({
    select: { slug: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });
  const products = await db.product.findMany({ select: { slug: true } });

  console.log("categories:", categories.map((c) => c.slug).join(", "));
  console.log("products:", products.map((p) => p.slug).join(", "));

  await db.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
