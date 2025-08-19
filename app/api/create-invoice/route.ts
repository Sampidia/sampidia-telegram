// app/api/generate-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Bot } from "grammy";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// use `prisma` in your application to read and write data in your DB

const bot = new Bot(process.env.BOT_TOKEN!);

export async function POST(req: NextRequest) {
  const { userId, title, description, amount, currency } = await req.json();

  // Create invoice in DB
  const newInvoice = await prisma.invoice.create({
    data: {
      userId,
      title,
      description,
      currency,
      amount,
      status: "PENDING",
    },
  });

  // Prepare Telegram invoice parameters
  const prices = [{ amount, label: title }];
  const payload = JSON.stringify({ invoiceId: amount });

  // Generate invoice link via Telegram Bot API
  const invoiceLink = await bot.api.createInvoiceLink(
    title,
    description,
    payload,
    "", // Provider token empty for Telegram Stars
    currency,
    prices
  );

  return NextResponse.json({ invoiceLink, invoiceId: amount });
}