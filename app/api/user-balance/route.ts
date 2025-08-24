import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Create Prisma client with Accelerate extension
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ['error'],
}).$extends(withAccelerate())

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find user by Telegram ID
    const user = await prisma.user.findUnique({
      where: { telegramId: String(userId) },
      select: { balance: true, telegramId: true, firstName: true }
    });

    if (user) {
      return NextResponse.json(
        { userBalance: user.balance },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    } else {
      // Create new user with default balance
      const newUser = await prisma.user.create({
        data: {
          telegramId: String(userId),
          firstName: 'New User',
          balance: 0
        },
        select: { balance: true }
      });
      
      return NextResponse.json(
        { userBalance: newUser.balance },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
  } catch (error) {
    console.error('Error in user-balance route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user balance'
    }, { status: 500 });
  }
}
