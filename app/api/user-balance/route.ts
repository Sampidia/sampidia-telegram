import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Create Prisma client with production database URL only
let prisma: any = null;

function getPrismaClient() {
  if (!prisma) {
    try {
      console.log('API: Using production database connection');
      prisma = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      }).$extends(withAccelerate());
    } catch (error) {
      console.error('API: Failed to initialize Prisma client:', error);
      throw error;
    }
  }
  return prisma;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  
  try {
    console.log('API: user-balance route called');
    userId = req.nextUrl.searchParams.get('userId');
    console.log('API: userId from params:', userId);

    if (!userId) {
      console.log('API: No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Environment check
    console.log('API: Environment check:');
    console.log('API: NODE_ENV:', process.env.NODE_ENV);
    console.log('API: DATABASE_URL exists:', !!process.env.DATABASE_URL);

    const client = getPrismaClient();
    console.log('API: Prisma client initialized successfully');

    // Test database connection first
    try {
      await client.$queryRaw`SELECT 1`;
      console.log('API: Database connection test successful');
    } catch (connectionError) {
      console.error('API: Database connection test failed:', connectionError);
      throw new Error('Database connection failed');
    }

    console.log('API: Attempting to find user with telegramId:', userId);
    
    // Find user by Telegram ID with timeout
    const user = await Promise.race([
      client.user.findUnique({
        where: { telegramId: String(userId) },
        select: { balance: true, telegramId: true, firstName: true }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]);

    console.log('API: Database query completed, user found:', !!user);
    console.log('API: User data:', user);

    if (user) {
      const responseTime = Date.now() - startTime;
      console.log(`API: Returning existing user balance: ${user.balance} (${responseTime}ms)`);
      
      return NextResponse.json(
        { 
          userBalance: user.balance,
          dataSource: 'database',
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
    } else {
      console.log('API: User not found, creating new user...');
      
      // Create new user with default balance
      const newUser = await Promise.race([
        client.user.create({
          data: {
            telegramId: String(userId),
            firstName: 'New User',
            balance: 0
          },
          select: { balance: true, telegramId: true }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User creation timeout')), 10000)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      console.log(`API: Created new user with balance: ${newUser.balance} (${responseTime}ms)`);
      
      return NextResponse.json(
        { 
          userBalance: newUser.balance,
          dataSource: 'database_new',
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
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('API: Error in user-balance route:', error);
    console.error('API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId,
      responseTime
    });
    
    return NextResponse.json({ 
      error: 'Failed to fetch user balance',
      details: error instanceof Error ? error.message : 'Unknown error',
      userId,
      responseTime
    }, { status: 500 });
  }
}