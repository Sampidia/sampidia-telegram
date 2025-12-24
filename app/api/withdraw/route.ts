import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from '@/lib/prisma';
import 'dotenv/config';

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

  console.log('🔄 Setting up email transporter...');
  console.log('SMTP Host:', process.env.SMTP_HOST);
  console.log('SMTP Port:', process.env.SMTP_PORT);
  console.log('SMTP Secure:', process.env.SMTP_SECURE);
  console.log('SMTP User:', process.env.SMTP_USER ? 'Set' : 'NOT SET');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // Use STARTTLS instead of SMTPS
    requireTLS: true, // Force TLS upgrade
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false, // For self-signed certificates
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  });

  const methodDetails = withdrawMethod === 'bank'
    ? `Bank: ${bankName}\nAccount: ${accountNumber} (${accountName})`
    : `TON Wallet: ${tonAddress}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL_G || 'hr@sampidia.com.ng',
    subject: 'New Withdrawal Request',
    text: `Withdrawal Request\n\nMethod: ${withdrawMethod}\nAmount: ${amount}\n${methodDetails}\nUser ID: ${userId}\nUsername: ${username}`
  };

  console.log('📧 Sending email with options:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Withdrawal email sent successfully:', result.messageId);
    return result;
  } catch (err: unknown) {
    console.error('❌ Failed to send withdrawal email:', err);
    const error = err as Error & { code?: string; response?: string; responseCode?: number };
    console.error('Error details:', {
      code: error?.code,
      response: error?.response,
      responseCode: error?.responseCode,
      message: error?.message
    });
    throw err;
  }
}

// Helper function for sending Telegram message (mock implementation)
async function sendTelegramMessage(userId: string, message: string) {
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

    // Create withdrawal record using Prisma
    let withdrawal;
    let withdrawalId = '';

    try {
      withdrawal = await prisma.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          withdrawMethod,
          bankName: withdrawMethod === 'bank' ? bankName : null,
          accountNumber: withdrawMethod === 'bank' ? accountNumber : null,
          accountName: withdrawMethod === 'bank' ? accountName : null,
          tonAddress: withdrawMethod === 'ton' ? tonAddress : null,
          status: 'PENDING',
          emailSent: false
        }
      });

      withdrawalId = withdrawal.id;
      console.log('Withdrawal record created with ID:', withdrawalId);

      // Send withdrawal email
      try {
        console.log('Attempting to send withdrawal email to:', process.env.SMTP_USER);
        console.log('SMTP Config:', {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE,
          user: process.env.SMTP_USER ? '***' : 'NOT SET'
        });

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
        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { emailSent: true }
        });

        console.log('✅ Withdrawal email sent successfully for withdrawal:', withdrawalId);
      } catch (emailError) {
        console.error('❌ Failed to send withdrawal email:', emailError);
        console.error('Email error details:', {
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          stack: emailError instanceof Error ? emailError.stack : undefined
        });
        // Don't fail the withdrawal if email fails, but log it
      }

      // Send Telegram message
      try {
        await sendTelegramMessage(
          userId,
          `✅ *Withdrawal Request Submitted!*\n\n` +
          `Method: *${withdrawMethod}*\n` +
          `Amount: *${amount.toLocaleString()} points*\n\n` +
          `New Balance: *${newBalance.toLocaleString()} points*\n\n` +
          `Status: *PENDING* - Waiting for admin approval`
        );
      } catch (telegramError) {
        console.error('Failed to send Telegram message:', telegramError);
      }

      // Keep withdrawal status as PENDING until admin processes it
      // Only mark email as sent, but don't change status to completed
      console.log('Withdrawal request created successfully with ID:', withdrawalId);
      console.log('Status remains PENDING until admin processes the withdrawal');

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
          await prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: { status: 'FAILED' }
          });
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