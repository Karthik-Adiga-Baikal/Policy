// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "@/app/generated/prisma"; 

// const connectionString = `${process.env.DATABASE_URL}`;

// const adapter = new PrismaPg({ connectionString });
// export const prisma = new PrismaClient({ adapter });


import { PrismaClient } from "../app/generated/prisma"; 

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;