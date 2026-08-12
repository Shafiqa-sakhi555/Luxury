import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { categories } from "../src/lib/categories";
import { branches } from "../src/lib/branches";
import { products as sampleProducts } from "../src/lib/data";
import { images } from "../src/lib/images";
import { toMinor } from "../src/lib/money";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const PERMISSIONS = [
  { key: "*", description: "All permissions" },
  { key: "dashboard.view", description: "View dashboard" },
  { key: "product.view", description: "View products" },
  { key: "product.write", description: "Edit products" },
  { key: "product.publish", description: "Publish products" },
  { key: "product.delete", description: "Delete products" },
  { key: "category.write", description: "Manage categories" },
  { key: "order.view", description: "View orders" },
  { key: "order.status", description: "Update order status" },
  { key: "inventory.view", description: "View inventory" },
  { key: "inventory.adjust", description: "Adjust inventory" },
  { key: "customer.view", description: "View customers" },
  { key: "user.manage", description: "Manage users" },
  { key: "audit.view", description: "View audit log" },
  { key: "settings.write", description: "System settings" },
];

async function main() {
  console.log("Seeding database...");

  for (const perm of PERMISSIONS) {
    await db.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  const allPerms = await db.permission.findMany();
  const permMap = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));

  const superAdminRole = await db.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: { name: "Super Admin", description: "Full system access" },
  });

  for (const perm of allPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  await db.role.upsert({
    where: { name: "Customer" },
    update: {},
    create: { name: "Customer", description: "Storefront customer" },
  });

  const adminEmail = "admin@jalalsgroup.com";
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const adminUser = await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPassword, isActive: true },
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash: adminPassword,
      userRoles: { create: { roleId: superAdminRole.id } },
    },
  });
  console.log(`Admin user: ${adminEmail} / Admin123!`);

  const brandMap: Record<string, string> = {};
  const jalalsBrand = await db.brand.upsert({
    where: { slug: "jalals-home" },
    update: {},
    create: {
      name: "Jalal's Home Solution",
      slug: "jalals-home",
      status: "ACTIVE",
    },
  });
  brandMap["jalals-home"] = jalalsBrand.id;

  const categoryMap: Record<string, string> = {};
  for (const cat of categories.filter((c) => !c.parent)) {
    const created = await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, heroImage: cat.image },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        heroImage: cat.image,
        status: "ACTIVE",
      },
    });
    categoryMap[cat.slug] = created.id;
  }

  // Merge legacy "carpet" category into "carpets" so only one carpet category exists
  const legacyCarpet = await db.category.findUnique({ where: { slug: "carpet" } });
  const carpetsCategory = await db.category.findUnique({ where: { slug: "carpets" } });
  if (legacyCarpet && carpetsCategory) {
    await db.product.updateMany({
      where: { categoryId: legacyCarpet.id },
      data: { categoryId: carpetsCategory.id },
    });
    await db.category.update({
      where: { id: legacyCarpet.id },
      data: { status: "ARCHIVED", slug: "carpet-legacy" },
    });
    categoryMap.carpets = carpetsCategory.id;
  } else if (legacyCarpet && !carpetsCategory) {
    await db.category.update({
      where: { id: legacyCarpet.id },
      data: { slug: "carpets", name: "Carpets" },
    });
    categoryMap.carpets = legacyCarpet.id;
  }

  for (const cat of categories.filter((c) => c.parent)) {
    const parentId = categoryMap[cat.parent!];
    const created = await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, heroImage: cat.image, parentId },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        heroImage: cat.image,
        parentId,
        status: "ACTIVE",
      },
    });
    categoryMap[cat.slug] = created.id;
  }

  const storeMap: Record<string, string> = {};
  for (const branch of branches) {
    const brandEnum =
      branch.brand === "pak-turk"
        ? "PAK_TURK"
        : branch.brand === "jalal-carpets"
          ? "JALAL_CARPETS"
          : "JALALS_HOME";
    const store = await db.store.upsert({
      where: { slug: branch.id },
      update: {
        name: branch.name,
        city: branch.city,
        region: branch.region,
        address: branch.address,
        phone: branch.phone,
        phoneDisplay: branch.phoneDisplay,
        hours: branch.hours,
        lat: branch.lat,
        lng: branch.lng,
        isFlagship: branch.isFlagship ?? false,
        brand: brandEnum,
        brandLabel: branch.brandLabel,
      },
      create: {
        slug: branch.id,
        brand: brandEnum,
        brandLabel: branch.brandLabel,
        name: branch.name,
        city: branch.city,
        region: branch.region,
        address: branch.address,
        phone: branch.phone,
        phoneDisplay: branch.phoneDisplay,
        hours: branch.hours,
        lat: branch.lat,
        lng: branch.lng,
        isFlagship: branch.isFlagship ?? false,
      },
    });
    storeMap[branch.id] = store.id;
  }

  const imageMap: Record<string, string> = {
    carpet: images.products.heritageCarpet,
    sofa: images.products.velvetSofa,
    rug: images.products.woolRug,
    curtain: images.products.velvetCurtains,
    bed: images.products.luxuryBed,
  };

  for (const p of sampleProducts) {
    const slug = p.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const categorySlug =
      p.category === "carpet"
        ? "carpets"
        : p.category === "sofa"
          ? "sofa"
          : p.category === "rug"
            ? "rugs"
            : p.category === "bed"
              ? "beds"
              : p.category === "curtain"
                ? "decor"
                : "decor";
    const categoryId = categoryMap[categorySlug];
    if (!categoryId) continue;

    const product = await db.product.upsert({
      where: { slug },
      update: {
        name: p.title,
        shortDescription: p.location,
        status: "ACTIVE",
        isFeatured: p.badge === "Bestseller" || p.badge === "New",
      },
      create: {
        name: p.title,
        slug,
        shortDescription: p.location,
        description: `${p.title} — premium quality from Jalal's Home Solution.`,
        categoryId,
        brandId: jalalsBrand.id,
        status: "ACTIVE",
        isFeatured: p.badge === "Bestseller" || p.badge === "New",
        productType: "VARIANT",
      },
    });

    const sku = `JHS-${slug.toUpperCase().slice(0, 12)}-001`;
    const variant = await db.productVariant.upsert({
      where: { sku },
      update: {
        priceMinor: toMinor(p.price),
        salePriceMinor: p.compareAtPrice ? toMinor(p.compareAtPrice) : null,
      },
      create: {
        productId: product.id,
        sku,
        name: "Default",
        priceMinor: toMinor(p.price),
        salePriceMinor: p.compareAtPrice ? toMinor(p.compareAtPrice) : null,
        isActive: true,
      },
    });

    const imageUrl = p.image || imageMap[p.category] || images.products.heritageCarpet;
    const existingMedia = await db.productMedia.findFirst({ where: { productId: product.id } });
    if (!existingMedia) {
      await db.productMedia.create({
        data: { productId: product.id, url: imageUrl, alt: p.title, sortOrder: 0 },
      });
    }

    const firstStoreId = Object.values(storeMap)[0];
    if (firstStoreId) {
      await db.inventoryBalance.upsert({
        where: { storeId_variantId: { storeId: firstStoreId, variantId: variant.id } },
        update: { onHand: 10 },
        create: { storeId: firstStoreId, variantId: variant.id, onHand: 10, reorderPoint: 3 },
      });
    }
  }

  const legalPages = [
    { slug: "terms", title: "Terms & Conditions", body: "Placeholder — client legal text required." },
    { slug: "privacy", title: "Privacy Policy", body: "Placeholder — client legal text required." },
    { slug: "returns", title: "Returns Policy", body: "Placeholder — client legal text required." },
    { slug: "delivery", title: "Delivery Information", body: "Placeholder — client delivery policy required." },
    { slug: "warranty", title: "Warranty", body: "Placeholder — client warranty text required." },
    { slug: "faqs", title: "FAQs", body: "Placeholder — client FAQ content required." },
  ];

  for (const page of legalPages) {
    await db.contentPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, body: page.body, status: "ACTIVE" },
      create: { ...page, status: "ACTIVE" },
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / Admin123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
