import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find user by Telegram ID
    const user = await prisma.user.findUnique({
      where: { telegramId: String(userId) },
      select: { balance: true }
    });

    // Return balance (0 if user not found)
    const userBalance = user?.balance ?? 0;
    return NextResponse.json(
      { userBalance },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json({ error: 'Failed to fetch user balance' }, { status: 500 });
  }
}
