import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId, transactionId } = body;

    // Get item details to calculate amount
    const { ITEMS } = await import('@/app/data/items');
    const item = ITEMS.find(i => i.id === itemId);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Generate a secret code for the purchase
    const secret = `SECRET_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

    console.log('Payment success processing:', {
      userId,
      itemId,
      transactionId,
      itemPrice: item.price
    });

    // Use transaction with row locking to prevent double balance updates
    const result = await prisma.$transaction(async (tx) => {
      // First, try to find existing payment with this transactionId pattern
      const existingPayment = await tx.payment.findFirst({
        where: {
          telegramId: String(userId),
          transactionId: {
            startsWith: 'mini_app_pending'
          },
          createdAt: {
            gte: new Date(Date.now() - 30000) // Last 30 seconds
          }
        }
      });

      if (existingPayment) {
        console.log('Mini app payment already being processed, skipping');
        return null;
      }

      // Update user balance
      const user = await tx.user.upsert({
        where: { telegramId: String(userId) },
        update: {
          balance: { increment: item.price },
          lastSeenAt: new Date()
        },
        create: {
          telegramId: String(userId),
          balance: item.price,
          lastSeenAt: new Date()
        }
      });

      // Create a temporary payment record to prevent double processing
      await tx.payment.create({
        data: {
          userId: user.id,
          telegramId: String(userId),
          transactionId: `mini_app_pending_${Date.now()}`,
          productName: item.name,
          itemId: String(itemId),
          amount: item.price,
          status: "PENDING",
        },
      });

      return user;
    });

    if (!result) {
      console.log('Payment already processed, returning early');
      return NextResponse.json({
        success: true,
        message: 'Payment already processed'
      });
    }

    console.log('Mini app payment - user balance updated:', {
      userId: result.id,
      telegramId: result.telegramId,
      newBalance: result.balance,
      amount: item.price
    });

    console.log('Payment success transaction completed successfully');

    return NextResponse.json({ 
      success: true, 
      secret: secret,
      amount: item.price 
    });
  } catch (error) {
    console.error("Error storing payment:", error);
    return NextResponse.json({ error: "Failed to store payment" }, { status: 500 });
  }
}