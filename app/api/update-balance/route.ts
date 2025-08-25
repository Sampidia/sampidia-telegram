import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const { userId, amount } = await request.json();

  if (!userId || typeof amount !== "number") {
    return NextResponse.json({ error: "Missing userId or amount" }, { status: 400 });
  }

  try {
    // Fetch current balance
    const user = await prisma.user.findUnique({
      where: { id: userId }, // Use the correct unique field name as defined in your Prisma schema
      select: { balance: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newBalance = user.balance + amount;

    // Update balance
    await prisma.user.update({
      where: { id: userId }, // Use the correct unique field name
      data: { balance: newBalance },
    });

    return NextResponse.json({ balance: newBalance });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}