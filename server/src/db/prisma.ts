import { PrismaClient } from '@prisma/client';
import { ServiceUnavailableError } from '../common/errors';
import { env } from '../config/env';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!env.DATABASE_URL) {
    throw new ServiceUnavailableError('Database is not configured');
  }
  if (!prisma) {
    prisma = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (!prisma) return;
  await prisma.$disconnect();
  prisma = null;
}

export async function pingDatabase(): Promise<'ok' | 'error' | 'skipped'> {
  if (!env.DATABASE_URL) return 'skipped';
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return 'ok';
  } catch {
    return 'error';
  }
}
