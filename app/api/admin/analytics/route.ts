import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';

export async function GET() {
  try {

    const now = new Date();

    // Time calculations
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get total withdrawals
    const totalResult = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED'
      }
    });

    // Get last 24 hours withdrawals
    const last24HoursResult = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: last24Hours },
        status: 'COMPLETED'
      }
    });

    // Get this month withdrawals
    const thisMonthResult = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: thisMonth },
        status: 'COMPLETED'
      }
    });

    // Get last 3 months withdrawals
    const last3MonthsResult = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: last3Months },
        status: 'COMPLETED'
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
  }
}
