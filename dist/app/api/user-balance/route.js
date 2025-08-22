import { NextResponse } from "next/server";
const { PrismaClient } = require('@prisma/client');
import { withAccelerate } from '@prisma/extension-accelerate';
const prisma = new PrismaClient().$extends(withAccelerate());
export async function GET(req) {
    // The 'userId' from the query parameters corresponds to the 'telegramId' in the database.
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
        return NextResponse.json({ error: "userId (telegramId) is required" }, { status: 400 });
    }
    try {
        // Check if the user exists in the database by their telegramId
        const user = await prisma.user.findUnique({
            where: { telegramId: String(userId) },
            select: { balance: true }, // Select only the balance field
            cacheStrategy: {
                ttl: 60, // cache is fresh for 60 seconds
                swr: 60, // serve stale data for up to 60 seconds while revalidating
            },
        });
        // Return the user's balance, or 0 if the user is not found
        return NextResponse.json({ balance: (user === null || user === void 0 ? void 0 : user.balance) || 0 });
    }
    catch (error) {
        console.error("Error fetching user balance:", error);
        return NextResponse.json({ error: "Failed to fetch user balance" }, { status: 500 });
    }
}
