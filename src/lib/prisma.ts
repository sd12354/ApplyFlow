import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({
  // Prisma 7.x expects an explicit driver adapter factory when using `@prisma/adapter-pg`.
  // Uses DATABASE_URL from your environment (loaded via Next's dotenv support).
  connectionString: process.env.DATABASE_URL ?? "",
});

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

