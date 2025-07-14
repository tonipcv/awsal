import { PrismaClient } from '@prisma/client';

/* eslint-disable no-var */
declare global {
  var prisma: PrismaClient | undefined;
}
/* eslint-enable no-var */

// Configurar a URL do banco com parâmetros de connection pool
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:5fc578abcbdf1f226aab@dpbdp1.easypanel.host:3245/servidor?sslmode=disable&connection_limit=20&pool_timeout=20';

export const prisma = globalThis.prisma || new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
} 