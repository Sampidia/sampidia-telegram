import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        // Find user by Telegram ID
        const user = await prisma.user.findUnique({
            where: { telegramId: userId },
            select: { balance: true }
        });
        // Return balance (0 if user not found)
        const userBalance = (user === null || user === void 0 ? void 0 : user.balance) || 0;
        return NextResponse.json({ userBalance });
    }
    catch (error) {
        console.error('Error fetching user balance:', error);
        return NextResponse.json({ error: 'Failed to fetch user balance' }, { status: 500 });
    }
}
