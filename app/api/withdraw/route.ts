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
async function sendTelegramMessage(userId: string, message: string, options?: any) {
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
      tonAddress,
      type
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

    // If just a withdrawal request (not balance update)
    if (type === 'withdrawal') {
      await sendWithdrawalEmail({ amount, bankName, accountNumber, accountName, userId, username, withdrawMethod, tonAddress });
      return NextResponse.json({ success: true });
    }

    // Transactional balance update
    let newBalance: number;
    try {
      newBalance = await prisma.$transaction(async (tx) => {
        // First, let's check if you have a User model with balance
        // If the balance is stored in User model:
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { balance: true }
        });

        if (!user) throw new Error("User not found");
        if (user.balance < amount) throw new Error("Insufficient balance");

        const updated = await tx.user.update({
          where: { id: userId },
          data: { balance: user.balance - amount }
        });

        return updated.balance;

        // Alternative: If balance is stored in a separate UserBalance model:
        /*
        const userBalance = await tx.userBalance.findUnique({
          where: { userId: userId },
          select: { balance: true }
        });

        if (!userBalance) throw new Error("User balance not found");
        if (userBalance.balance < amount) throw new Error("Insufficient balance");

        const updated = await tx.userBalance.update({
          where: { userId: userId },
          data: { balance: userBalance.balance - amount }
        });

        return updated.balance;
        */
      });

      // Send withdrawal email and Telegram message after transaction
      await sendWithdrawalEmail({ amount, bankName, accountNumber, accountName, userId, username, withdrawMethod, tonAddress });
      await sendTelegramMessage(
        userId,
        `✅ *Withdrawal Processed!*\n\n` +
        `Method: *${withdrawMethod}*\n` +
        `Amount: *${amount.toLocaleString()} points*\n\n` +
        `New Balance: *${newBalance.toLocaleString()} points*\n\n`,
        { parse_mode: 'Markdown' }
      );

      return NextResponse.json({ 
        success: true,
        newBalance,
        withdrawMethod
      });

    } catch (error: any) {
      if (error.message === "User not found" || error.message === "User balance not found") {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }
      if (error.message === "Insufficient balance") {
        return NextResponse.json({ message: error.message }, { status: 400 });
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