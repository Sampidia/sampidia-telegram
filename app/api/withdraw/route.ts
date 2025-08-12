import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabase } from '@/lib/supabase';
import { sendTelegramMessage } from "@/lib/telegram/route"; 

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
      withdrawMethod,  // Added withdrawMethod to destructuring
      tonAddress      // Added tonAddress to destructuring
    } = body;

    // Validate required fields based on withdrawal method
    if (!userId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    // Validate method-specific fields
    if (withdrawMethod === 'bank' && (!accountNumber || !accountName || !bankName)) {
      return NextResponse.json({ message: "Missing bank details" }, { status: 400 });
    }
    if (withdrawMethod === 'ton' && !tonAddress) {
      return NextResponse.json({ message: "Missing TON wallet address" }, { status: 400 });
    }

    // Handle withdrawal notification
    if (body.type === 'withdrawal') {
      const transporter = nodemailer.createTransport({  // Fixed typo: createTransporter -> createTransport
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

      return NextResponse.json({ success: true });
    }

    // Handle balance withdrawal
    try {
      const { data, error } = await supabase
        .from("purchase")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        return NextResponse.json({ message: "User balance not found" }, { status: 404 });
      }

      if (data.balance < amount) {
        return NextResponse.json({ message: "Insufficient balance" }, { status: 400 });
      }

      // Update balance
      const { error: updateError } = await supabase
        .from("purchase")
        .update({ balance: data.balance - amount })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      // Send withdrawal email
      const transporter = nodemailer.createTransport({  // Fixed typo here too
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
      } catch (err) {
        console.error('Failed to send withdrawal email:', err);
      }

      // Send confirmation message
      await sendTelegramMessage(
        userId,
        `✅ *Withdrawal Processed!*\n\n` +
        `Method: *${withdrawMethod}*\n` +
        `Amount: *${amount.toLocaleString()} points*\n\n` +
        `New Balance: *${(data.balance - amount).toLocaleString()} points*\n\n`,
        { parse_mode: 'Markdown' }
      );

      return NextResponse.json({ 
        success: true,
        newBalance: data.balance - amount,
        withdrawMethod  // Return the method for client confirmation
      });

    } catch (error) {
      console.error("Withdraw API error:", error);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }

  } catch (error) {
    console.error("Withdraw API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}