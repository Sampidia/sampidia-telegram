import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSecretForItem } from '@/app/server/item-secrets';

// POST handler for creating a new purchase
export async function POST(req: NextRequest) {
  try {
    const { userId, itemId, itemName } = await req.json();

    if (!userId || !itemId || !itemName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const itemSecret = getSecretForItem(itemId);
    if (!itemSecret) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // First, ensure user exists and get their ID
    const user = await prisma.user.upsert({
      where: { telegramId: String(userId) },
      update: {
        lastSeenAt: new Date()
      },
      create: {
        telegramId: String(userId),
        lastSeenAt: new Date()
      }
    });

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: String(userId),
        transactionId: `pending_${Date.now()}_${userId}`,
        productName: String(itemName),
        itemId: String(itemId),
        amount: 100,
        status: 'PENDING',
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET handler for retrieving a user's purchase history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        telegramId: String(userId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ purchases: payments });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}