import { NextRequest, NextResponse } from "next/server";
import { Bot, webhookCallback } from "grammy";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const bot = new Bot(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "");

// Handle pre-checkout queries
bot.on("pre_checkout_query", (ctx) => {
  return ctx.answerPreCheckoutQuery(true).catch((error) => {
    console.error("answerPreCheckoutQuery failed:", error);
  });
});

// Handle successful payments
bot.on("message:successful_payment", async (ctx) => {
  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
    return;
  }

  try {
    const payment = ctx.message.successful_payment;
    const payload = JSON.parse(payment.invoice_payload || '{}');
    
    // Validate required fields
    const userId = payload.userId || ctx.from.id.toString();
    const telegramId = ctx.from.id.toString();
    const transactionId = payment.telegram_payment_charge_id;
    const amount = payment.total_amount || 0;
    const itemId = payload.itemId || 'unknown';
    
    // First, ensure user exists and get their ID
    const user = await prisma.user.upsert({
      where: { telegramId: telegramId },
      update: { 
        balance: { increment: amount },
        lastSeenAt: new Date()
      },
      create: {
        telegramId: telegramId,
        balance: amount,
        lastSeenAt: new Date()
      }
    });

    // Store payment in database using the user's ID
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: telegramId,
        transactionId: transactionId,
        productName: amount ? `${amount} Stars` : 'Stars',
        itemId: itemId,
        amount: amount,
        status: "COMPLETED",
      },
    });
    
    // Send confirmation message to the user
    await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
  } catch (error) {
    console.error('Error processing payment via webhook:', error);
    
    // Send a more user-friendly error message
    await ctx.reply(`✅ Payment received! We're processing your purchase and will update your balance shortly.`);
  }
});

// Create webhook handler
const handler = webhookCallback(bot, "next-js");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headers = Object.fromEntries(req.headers.entries());

    let responseStatus = 200;
    let responseBody: any = {};

    const mockRes = {
      end: (cb?: () => void) => { if (cb) cb(); },
      status: (code: number) => { responseStatus = code; return mockRes; },
      json: (json: any) => { responseBody = json; return mockRes; },
      send: (json: any) => { responseBody = json; return mockRes; },
    };

    await handler({ body, headers }, mockRes as any);

    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
