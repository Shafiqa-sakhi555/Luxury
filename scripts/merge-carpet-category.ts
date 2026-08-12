import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const legacy = await db.category.findUnique({ where: { slug: "carpet" } });
  const modern = await db.category.findUnique({ where: { slug: "carpets" } });

  if (legacy && modern) {
    const moved = await db.product.updateMany({
      where: { categoryId: legacy.id },
      data: { categoryId: modern.id },
    });
    await db.category.update({
      where: { id: legacy.id },
      data: { status: "ARCHIVED", slug: "carpet-legacy" },
    });
    console.log(`Merged ${moved.count} products from carpet → carpets`);
  } else if (legacy && !modern) {
    await db.category.update({
      where: { id: legacy.id },
      data: { slug: "carpets", name: "Carpets" },
    });
    console.log("Renamed legacy carpet category to carpets");
  } else {
    console.log("No legacy carpet category to merge");
  }

  const count = await db.product.count({
    where: { category: { slug: "carpets" }, status: "ACTIVE" },
  });
  console.log(`Active products in carpets category: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
