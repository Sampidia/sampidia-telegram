import { PrismaClient } from '@prisma/client'

// Ensure a single PrismaClient instance in dev to prevent too many connections
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  // Use DATABASE_URL first, otherwise fall back to PRISMA_DATABASE_URL
  const datasourceUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL
  
  console.log('Creating Prisma client with URL:', datasourceUrl ? 'URL provided' : 'No URL found')
  
  return new PrismaClient({
    datasourceUrl,
    log: ['query', 'info', 'warn', 'error'],
  })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma