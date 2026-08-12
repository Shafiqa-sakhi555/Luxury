import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and point it at your PostgreSQL database."
    );
  }

  const isDev = process.env.NODE_ENV === "development";

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      // Keep the pool tiny in dev — the local `prisma dev` proxy closes idle
      // connections aggressively and a large pool hands out dead sockets.
      max: isDev ? 1 : 10,
      idleTimeoutMillis: isDev ? 1 : 30_000,
      connectionTimeoutMillis: 10_000,
    }),
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
