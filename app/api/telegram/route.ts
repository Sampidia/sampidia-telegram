import { NextRequest, NextResponse } from "next/server";
import { Bot, webhookCallback } from "grammy";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// Initialize the bot with your token
const bot = new Bot(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "");

// Command handlers
bot.command("start", (ctx) =>
  ctx.reply(
    `Welcome to SamPidia! 🌟 I am a bot that can accept payments via Telegram Stars. The following commands are available:

/send1 - Sell 1 Star for $0.008
/send25 - Sell 25 Stars for $0.2
/send50 - Sell 50 Stars for $0.4
/send100 - Sell 100 Stars for $0.8
/send500 - Sell 500 Stars for $4
/send1000 - Sell 1000 Stars for $8
/balance - Check your current balance
/withdraw - Withdraw your balance
/refund - Request a refund for a purchase
`
  )
);

// Helper function to create invoice
const createInvoice = (ctx: any, itemName: string, itemDescription: string, amount: number) => {
  return ctx.replyWithInvoice(
    itemName,
    itemDescription,
    JSON.stringify({ 
      itemId: itemName.toLowerCase().replace(/\s+/g, ''),
      userId: ctx.from?.id 
    }),
    "XTR", // Currency for Telegram Stars
    [{ amount: amount, label: itemName }],
  );
};

// Star purchase commands
bot.command("send1", (ctx) => createInvoice(ctx, "1 Star ✨", "$0.009", 1));
bot.command("send25", (ctx) => createInvoice(ctx, "25 Stars 🌟", "$0.225", 25));
bot.command("send50", (ctx) => createInvoice(ctx, "50 Stars ⭐", "$0.45", 50));
bot.command("send100", (ctx) => createInvoice(ctx, "100 Stars ⭐", "$0.9", 100));
bot.command("send500", (ctx) => createInvoice(ctx, "500 Stars ⭐", "$4.5", 500));
bot.command("send1000", (ctx) => createInvoice(ctx, "1000 Stars ⭐", "$9", 1000));

// Pre-checkout query handler
bot.on("pre_checkout_query", (ctx) => {
  return ctx.answerPreCheckoutQuery(true).catch((error) => {
    console.error("answerPreCheckoutQuery failed:", error);
  });
});

// Successful payment handler
bot.on("message:successful_payment", async (ctx) => {
  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
    return;
  }

  try {
    const payment = ctx.message.successful_payment;
    const payload = JSON.parse(payment.invoice_payload || '{}');
    const telegramId = ctx.from.id.toString();
    const amount = payment.total_amount || 0;

    // Check if payment already exists to prevent double processing
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: payment.telegram_payment_charge_id }
    });

    if (existingPayment) {
      console.log('Payment already processed, skipping telegram API processing');
      await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
      return;
    }

    // First, ensure user exists and get their ID
    const user = await prisma.user.upsert({
      where: { telegramId: telegramId },
      update: {
        balance: { increment: amount },
        lastSeenAt: new Date()
      },
      create: {
        telegramId: telegramId,
        firstName: ctx.from.first_name || '',
        username: ctx.from.username || '',
        balance: amount,
        lastSeenAt: new Date()
      }
    });

    console.log('User upsert result:', {
      userId: user.id,
      telegramId: user.telegramId,
      newBalance: user.balance
    });

    // Store payment in database using the user's ID
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: telegramId,
        transactionId: payment.telegram_payment_charge_id,
        productName: amount ? `${amount} Stars` : 'Stars',
        itemId: payload.itemId || 'unknown',
        amount: amount,
        status: "COMPLETED",
      },
    });

    console.log('Payment record created successfully');

    // Send confirmation message
    await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
  } catch (error) {
    console.error('Error processing payment:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      payment: ctx.message.successful_payment
    });

    // Send a more user-friendly error message
    await ctx.reply(`✅ Payment received! We're processing your purchase and will update your balance shortly.`);
  }
});

/*
  Handles the /balance command.
  Shows the user's current balance.
*/
bot.command("balance", async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('❌ Unable to identify your Telegram ID. Please try again.');
      return;
    }

    const telegramId = ctx.from.id.toString();
    
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId },
    });
    
    const balance = user?.balance || 0;
    await ctx.reply(`💰 Your current balance: ${balance} Stars`);
  } catch (error) {
    console.error('Error fetching balance:', error);
    await ctx.reply('❌ Error fetching your balance. Please try again.');
  }
});

// Withdraw command
bot.command("withdraw", (ctx) => {
  ctx.reply(
    `💳 To withdraw your Stars balance, please contact our support team with your withdrawal request.

Your Telegram ID: ${ctx.from?.id}
Current balance: Check with /balance command
Open the Mini App and withdraw.

We'll process your withdrawal within 24-48 hours.`
  );
});

// Refund command
bot.command("refund", (ctx) => {
  ctx.reply(
    `🔄 To request a refund, please provide:
    
1. Your Telegram ID: ${ctx.from?.id}
2. Transaction ID from your purchase
3. Reason for refund

Contact our support team and we'll process your refund within 24-48 hours.`
  );
});

// Create webhook handler for Next.js
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

// Health check route
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "SamPidia Telegram Bot is running 🚀",
    timestamp: new Date().toISOString()
  });
}
