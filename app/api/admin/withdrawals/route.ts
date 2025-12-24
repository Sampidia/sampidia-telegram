import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';

export async function GET() {
  try {

    // Get withdrawals with user relations
    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100, // Limit to 100 recent withdrawals
    });

    // Format the data for the frontend
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      withdrawMethod: withdrawal.withdrawMethod,
      bankName: withdrawal.bankName,
      accountNumber: withdrawal.accountNumber,
      accountName: withdrawal.accountName,
      tonAddress: withdrawal.tonAddress,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt.toISOString(),
    }));

    return NextResponse.json({
      withdrawals: formattedWithdrawals,
      count: formattedWithdrawals.length,
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

// Update withdrawal status
export async function PATCH(req: NextRequest) {
  try {
    const { withdrawalId, status } = await req.json();

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { error: 'Missing withdrawalId or status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, COMPLETED, or FAILED' },
        { status: 400 }
      );
    }

    // Update withdrawal status
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: status,
        processedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal,
    });
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal status' },
      { status: 500 }
    );
  }
}
