import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
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
    return NextResponse.json({ 
      balance: user?.balance || 0 
    });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json({ error: 'Failed to fetch user balance' }, { status: 500 });
  }
}
