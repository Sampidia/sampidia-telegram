import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get('telegramId');

    console.log('Withdrawal history API called with telegramId:', telegramId);

    if (!telegramId) {
      return NextResponse.json({ message: "TelegramId is required" }, { status: 400 });
    }

    // Find user by telegramId
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true }
    });

    console.log('User found:', user ? 'Yes' : 'No', user?.id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Fetch withdrawal history for the user
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        withdrawMethod: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        tonAddress: true,
        status: true,
        createdAt: true,
        processedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.map((withdrawal: any) => ({
        id: withdrawal.id,
        amount: withdrawal.amount,
        withdrawMethod: withdrawal.withdrawMethod,
        bankName: withdrawal.bankName,
        accountNumber: withdrawal.accountNumber,
        accountName: withdrawal.accountName,
        tonAddress: withdrawal.tonAddress,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt.toISOString(),
        processedAt: withdrawal.processedAt?.toISOString()
      }))
    });

  } catch (error) {
    console.error("Withdrawals API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}