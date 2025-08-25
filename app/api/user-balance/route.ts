import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Create Prisma client with better error handling and connection management
let prisma: any = null;

function getPrismaClient() {
  if (!prisma) {
    try {
      // Try with Accelerate first (for production)
      if (process.env.DATABASE_URL?.startsWith('prisma+postgres://')) {
        console.log('API: Using Prisma Accelerate connection');
        prisma = new PrismaClient({
          datasourceUrl: process.env.DATABASE_URL,
          log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        }).$extends(withAccelerate());
      } else {
        // Fallback to direct connection
        console.log('API: Using direct database connection');
        const connectionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DIRECT_DATABASE_URL;
        prisma = new PrismaClient({
          datasourceUrl: connectionUrl,
          log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });
      }
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
    console.log('API: DATABASE_URL type:', process.env.DATABASE_URL?.startsWith('prisma+postgres://') ? 'Accelerate' : 'Direct');
    console.log('API: POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
    console.log('API: DIRECT_DATABASE_URL exists:', !!process.env.DIRECT_DATABASE_URL);

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

    // Fallback mechanism for production
    if (process.env.NODE_ENV === 'production') {
      console.log('API: Using fallback mechanism in production');
      
      // Return a default balance for known test users
      const fallbackBalances: Record<string, number> = {
        '': 0,
      };
      
      const fallbackBalance = fallbackBalances[userId || ''] || 0;
      
      return NextResponse.json(
        { 
          userBalance: fallbackBalance,
          dataSource: 'fallback',
          error: 'Database temporarily unavailable',
          responseTime: responseTime
        },
        { 
          status: 200, 
          headers: { 
            'Cache-Control': 'no-store, max-age=0',
            'X-Response-Time': `${responseTime}ms`,
            'X-Fallback': 'true'
          } 
        }
      );
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch user balance',
      details: error instanceof Error ? error.message : 'Unknown error',
      userId,
      responseTime
    }, { status: 500 });
  }
}
