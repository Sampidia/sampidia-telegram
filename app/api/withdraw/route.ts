import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WithdrawalEmailParams {
  amount: number;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  userId: string;
  username?: string;
  withdrawMethod: string;
  tonAddress?: string;
}

// Helper function for sending email
async function sendWithdrawalEmail(params: WithdrawalEmailParams) {
  const { amount, bankName, accountNumber, accountName, userId, username, withdrawMethod, tonAddress } = params;
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const methodDetails = withdrawMethod === 'bank' 
    ? `Bank: ${bankName}\nAccount: ${accountNumber} (${accountName})`
    : `TON Wallet: ${tonAddress}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: 'sampidia0@gmail.com',
    subject: 'New Withdrawal Request',
    text: `Withdrawal Request\n\nMethod: ${withdrawMethod}\nAmount: ${amount}\n${methodDetails}\nUser ID: ${userId}\nUsername: ${username}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Withdrawal email sent successfully');
  } catch (err) {
    console.error('Failed to send withdrawal email:', err);
  }
}

// Helper function for sending Telegram message (mock implementation)
async function sendTelegramMessage(userId: string, message: string, options?: Record<string, unknown>) {
  try {
    // Implement your Telegram message sending logic here
    // This is a placeholder - replace with your actual Telegram API call
    console.log(`Sending Telegram message to ${userId}: ${message}`);
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      amount,
      bankName,
      accountNumber,
      userId,
      accountName,
      username,
      withdrawMethod,
      tonAddress
    } = body;

    if (!userId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (withdrawMethod === 'bank' && (!accountNumber || !accountName || !bankName)) {
      return NextResponse.json({ message: "Missing bank details" }, { status: 400 });
    }
    if (withdrawMethod === 'ton' && !tonAddress) {
      return NextResponse.json({ message: "Missing TON wallet address" }, { status: 400 });
    }

    // Check user balance first
    const user = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { id: true, balance: true, username: true }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.balance < amount) {
      return NextResponse.json({ message: "Insufficient balance" }, { status: 400 });
    }

    // Update balance first
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { balance: user.balance - amount }
    });

    const newBalance = updatedUser.balance;

    // For now, let's create a simple withdrawal record using raw SQL since the Prisma client might not be updated yet
    // This is a temporary solution until the migration is properly applied
    let withdrawalId = '';

    try {
      // Create withdrawal record using raw SQL
      const createWithdrawalQuery = `
        INSERT INTO "Withdrawal" ("id", "userId", "amount", "withdrawMethod", "bankName", "accountNumber", "accountName", "tonAddress", "status", "emailSent", "createdAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING "id"
      `;

      const withdrawalResult = await prisma.$queryRawUnsafe(
        createWithdrawalQuery,
        userId,
        amount,
        withdrawMethod,
        withdrawMethod === 'bank' ? bankName : null,
        withdrawMethod === 'bank' ? accountNumber : null,
        withdrawMethod === 'bank' ? accountName : null,
        withdrawMethod === 'ton' ? tonAddress : null,
        'PENDING',
        false
      ) as Array<{ id: string }>;

      withdrawalId = withdrawalResult[0]?.id || '';

      // Send withdrawal email
      try {
        await sendWithdrawalEmail({
          amount,
          bankName,
          accountNumber,
          accountName,
          userId,
          username: username || user.username,
          withdrawMethod,
          tonAddress
        });

        // Update withdrawal record to mark email as sent
        await prisma.$queryRawUnsafe(
          'UPDATE "Withdrawal" SET "emailSent" = true WHERE "id" = $1',
          withdrawalId
        );
      } catch (emailError) {
        console.error('Failed to send withdrawal email:', emailError);
        // Don't fail the withdrawal if email fails, but log it
      }

      // Send Telegram message
      try {
        await sendTelegramMessage(
          userId,
          `✅ *Withdrawal Processed!*\n\n` +
          `Method: *${withdrawMethod}*\n` +
          `Amount: *${amount.toLocaleString()} points*\n\n` +
          `New Balance: *${newBalance.toLocaleString()} points*\n\n` +
          `Status: Processing`,
          { parse_mode: 'Markdown' }
        );
      } catch (telegramError) {
        console.error('Failed to send Telegram message:', telegramError);
      }

      // Update withdrawal status to completed
      await prisma.$queryRawUnsafe(
        'UPDATE "Withdrawal" SET "status" = $1, "processedAt" = NOW() WHERE "id" = $2',
        'COMPLETED',
        withdrawalId
      );

      return NextResponse.json({
        success: true,
        newBalance,
        withdrawMethod,
        withdrawalId
      });

    } catch (error: unknown) {
      // If transaction failed, try to mark withdrawal as failed
      if (withdrawalId) {
        try {
          await prisma.$queryRawUnsafe(
            'UPDATE "Withdrawal" SET "status" = $1 WHERE "id" = $2',
            'FAILED',
            withdrawalId
          );
        } catch (updateError) {
          console.error('Failed to update withdrawal status:', updateError);
        }
      }

      console.error("Withdraw API error:", error);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }

  } catch (error) {
    console.error("Withdraw API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}