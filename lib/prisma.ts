import { PrismaClient } from '../app/generated/prisma-client';
import { withAccelerate } from "@prisma/extension-accelerate";
import { z } from "zod";

// Example Zod schema for User creation
const UserCreateInputSchema = z.object({
  // define your user fields here, e.g.:
  name: z.string(),
  email: z.string().email(),
  // ...other fields
});

// Prisma Client extension for Zod validation
const withValidation = {
  query: {
    user: {
      create({ args, query }: { args: any; query: any }) {
        args.data = UserCreateInputSchema.parse(args.data);
        return query(args);
      },
      update({ args, query }: { args: any; query: any }) {
        args.data = UserCreateInputSchema.partial().parse(args.data);
        return query(args);
      },
      // Add other methods as needed
    },
  },
};

const getExtendedClient = () =>
  new PrismaClient().$extends(withValidation).$extends(withAccelerate());

type ExtendedPrismaClient = ReturnType<typeof getExtendedClient>;

const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? getExtendedClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;