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

    // Check if payment already exists to prevent double processing
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: String(transactionId) }
    });

    if (existingPayment) {
      console.log('Payment already processed, skipping payment-success processing');
      return NextResponse.json({
        success: true,
        message: 'Payment already processed'
      });
    }

    // First, ensure user exists and get their ID
    const user = await prisma.user.upsert({
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

    console.log('User upsert result:', {
      userId: user.id,
      telegramId: user.telegramId,
      newBalance: user.balance
    });

    // Store payment in database using the user's ID
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: String(userId),
        transactionId: String(transactionId),
        productName: item.name,
        itemId: String(itemId),
        amount: item.price,
        status: "COMPLETED",
      },
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