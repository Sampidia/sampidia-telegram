import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Global Prisma client instance
const prisma = new PrismaClient({
  log: ['error'],
})

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Use upsert for atomic operation - find or create user in single query
    const user = await prisma.user.upsert({
      where: { telegramId: String(userId) },
      update: {}, // Don't update anything if user exists
      create: {
        telegramId: String(userId),
        firstName: 'New User',
        balance: 0
      },
      select: { 
        balance: true, 
        telegramId: true, 
        firstName: true 
      }
    });

    const responseTime = Date.now() - startTime;
    const isNewUser = user.firstName === 'New User' && user.balance === 0;

    return NextResponse.json(
      { 
        userBalance: user.balance,
        dataSource: isNewUser ? 'database_new' : 'database',
        responseTime: responseTime
      },
      { 
        status: 200, 
        headers: { 
          'Cache-Control': 'no-store, max-age=0',
          'X-Response-Time': `${responseTime}ms`
        } 
      }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({ 
      error: 'Failed to fetch user balance',
      details: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    }, { status: 500 });
  }
}

// Cleanup function for graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})