import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { z } from "zod";
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
    // Add other fields as needed
});
// Prisma Client extension for Zod validation
const withValidation = {
    query: {
        user: {
            create({ args, query }) {
                args.data = UserCreateInputSchema.parse(args.data);
                return query(args);
            },
            update({ args, query }) {
                args.data = UserCreateInputSchema.partial().parse(args.data);
                return query(args);
            },
            // Add other methods as needed
        },
    },
};
// Compose the Prisma Client with both extensions
const prisma = new PrismaClient()
    .$extends(withAccelerate())
    .$extends(withValidation);
export default prisma;
