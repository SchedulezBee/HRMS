import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
  prismaAdapter?: PrismaPg;
};

function isConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return [
    "Connection terminated unexpectedly",
    "Server has closed the connection",
    "Can't reach database server",
    "Connection ended unexpectedly",
    "ECONNRESET",
  ].some((message) => error.message.includes(message));
}

function createPool() {
  const pool = new Pool({
    connectionString,
    allowExitOnIdle: true,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    max: 4,
    maxLifetimeSeconds: 60,
  });

  pool.on("error", (error) => {
    console.error("[prisma-pool-error]", error.message);
  });

  return pool;
}

function createPrismaClient() {
  const pool = globalForPrisma.prismaPool ?? createPool();
  const adapter =
    globalForPrisma.prismaAdapter ??
    new PrismaPg(pool, {
      onConnectionError: (error) => {
        console.error("[prisma-connection-error]", error.message);
      },
      onPoolError: (error) => {
        console.error("[prisma-adapter-pool-error]", error.message);
      },
    });

  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaPool = pool;
    globalForPrisma.prismaAdapter = adapter;
    globalForPrisma.prisma = client;
  }

  return client;
}

export function getPrismaClient() {
  return globalForPrisma.prisma ?? createPrismaClient();
}

export const prisma = getPrismaClient();

export async function resetPrismaClient() {
  await globalForPrisma.prisma?.$disconnect().catch(() => undefined);
  await globalForPrisma.prismaPool?.end().catch(() => undefined);
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaAdapter = undefined;
  globalForPrisma.prismaPool = undefined;
  return createPrismaClient();
}

export async function withDatabaseRetry<T>(operation: (client: PrismaClient) => Promise<T>) {
  try {
    return await operation(getPrismaClient());
  } catch (error) {
    if (!isConnectionError(error)) {
      throw error;
    }

    const retriedClient = await resetPrismaClient();
    return operation(retriedClient);
  }
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
