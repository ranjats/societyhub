import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[Prisma] DATABASE_URL environment variable is not set.");
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please check your Vercel environment variables."
    );
  }

  console.log("[Prisma] Creating new client with connection string:", connectionString.replace(/:[^:@]+@/, ":***@"));

  const pool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("[Prisma] Unexpected pool error:", err);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
