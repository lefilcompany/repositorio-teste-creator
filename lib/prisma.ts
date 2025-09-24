import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configurações para melhor estabilidade e performance
    transactionOptions: {
      maxWait: 20000, // 20 seconds
      timeout: 60000, // 60 seconds
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
