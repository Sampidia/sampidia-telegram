import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Fetch withdrawal history for the user using raw SQL as fallback
    let withdrawals: any[] = [];

    try {
      // Try using Prisma client first
      withdrawals = await prisma.withdrawal.findMany({
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
      console.log('Found withdrawals using Prisma:', withdrawals.length);
    } catch (prismaError) {
      console.error('Prisma withdrawal query failed, trying raw SQL:', prismaError);

      // Fallback to raw SQL
      const withdrawalQuery = `
        SELECT "id", "amount", "withdrawMethod", "bankName", "accountNumber", "accountName", "tonAddress", "status", "createdAt", "processedAt"
        FROM "Withdrawal"
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
      `;

      const rawResults = await prisma.$queryRawUnsafe(withdrawalQuery, user.id) as any[];
      withdrawals = rawResults;
      console.log('Found withdrawals using raw SQL:', withdrawals.length);
    }

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