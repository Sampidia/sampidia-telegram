import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { z } from 'zod'

// Define your Zod schema for User creation
const UserCreateInputSchema = z.object({
  telegramId: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  balance: z.number().int().optional(),
  withdrawalAmount: z.number().int().optional(),
  isActive: z.boolean().optional(),
  lastSeenAt: z.date().optional(),
})

// Prisma Client extension for Zod validation
const withValidation = {
  query: {
    user: {
      create({ args, query }: { args: any; query: any }) {
        args.data = UserCreateInputSchema.parse(args.data)
        return query(args)
      },
      update({ args, query }: { args: any; query: any }) {
        args.data = UserCreateInputSchema.partial().parse(args.data)
        return query(args)
      },
    },
  },
}

// Ensure a single PrismaClient instance in dev to prevent too many connections
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  // Use a plain Postgres URL by default; only enable Accelerate if explicitly configured
  const datasourceUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

  let client = new PrismaClient({ datasourceUrl })

  if (process.env.PRISMA_ACCELERATE_URL) {
    client = client.$extends(withAccelerate()) as unknown as PrismaClient
  }

  // Always apply validation
  return client.$extends(withValidation) as unknown as PrismaClient
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma