import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // Authenticate admin
  const authError = await authenticateAdmin(request);
  if (authError) return authError;

  try {

    const now = new Date();

    // Time calculations
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get total withdrawals
    const totalResult = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
    });

    // Get last 24 hours withdrawals
    const last24HoursResult = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: last24Hours }
      }
    });

    // Get this month withdrawals
    const thisMonthResult = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: thisMonth }
      }
    });

    // Get last 3 months withdrawals
    const last3MonthsResult = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: last3Months }
      }
    });

    const analytics = {
      total: totalResult._sum.amount || 0,
      last24Hours: last24HoursResult._sum.amount || 0,
      thisMonth: thisMonthResult._sum.amount || 0,
      last3Months: last3MonthsResult._sum.amount || 0,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching withdrawal analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
