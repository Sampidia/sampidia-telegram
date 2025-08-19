import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// use `prisma` in your application to read and write data in your DB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telegramId, transactionId, productName, itemId, amount } = body;

    // Use a transaction to ensure atomicity
    
    await prisma.$transaction([
      prisma.payment.create({
  data: {
    userId: String(telegramId),
    telegramId: String(telegramId),
    transactionId: String(transactionId),
    productName: String(productName),
    itemId: String(itemId),
    amount: amount,
    status: "COMPLETED",
        },
      }),
      prisma.user.update({
        where: { id: String(telegramId) },
        data: { balance: { increment: amount } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing payment:", error);
    return NextResponse.json({ error: "Failed to store payment" }, { status: 500 });
  }
}