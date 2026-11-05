import { PrismaClient } from "@prisma/client";

// Singleton Prisma client — évite les connexions multiples en dev
// et ne tente PAS de connexion à la DB au niveau module (uniquement lors des requêtes)
declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma = globalThis._prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis._prisma = prisma;
}
