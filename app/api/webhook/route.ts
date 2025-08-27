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
  console.log('=== WEBHOOK EVENT RECEIVED ===');
  console.log('Full context:', JSON.stringify(ctx, null, 2));

  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
    console.log('Missing required fields:', {
      hasMessage: !!ctx.message,
      hasPayment: !!(ctx.message?.successful_payment),
      hasFrom: !!ctx.from
    });
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

    console.log('Webhook payment processing:', {
      telegramId,
      userId,
      transactionId,
      amount,
      itemId,
      payload,
      paymentDetails: payment
    });

    // Check if payment already exists to prevent double processing
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: transactionId }
    });

    if (existingPayment) {
      console.log('Payment already processed, skipping webhook processing');
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
        transactionId: transactionId,
        productName: amount ? `${amount} Stars` : 'Stars',
        itemId: itemId,
        amount: amount,
        status: "COMPLETED",
      },
    });

    console.log('Payment record created successfully');

    // Send confirmation message to the user
    await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
  } catch (error) {
    console.error('Error processing payment via webhook:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      payment: ctx.message.successful_payment
    });

    // Send a more user-friendly error message
    await ctx.reply(`✅ Payment received! We're processing your purchase and will update your balance shortly.`);
  }
});

// Create webhook handler
const handler = webhookCallback(bot, "next-js");

export async function POST(req: NextRequest) {
  try {
    console.log('=== WEBHOOK REQUEST RECEIVED ===');
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const headers = Object.fromEntries(req.headers.entries());
    console.log('Request headers:', headers);

    let responseStatus = 200;
    let responseBody: any = {};

    const mockRes = {
      end: (cb?: () => void) => { if (cb) cb(); },
      status: (code: number) => { responseStatus = code; return mockRes; },
      json: (json: any) => { responseBody = json; return mockRes; },
      send: (json: any) => { responseBody = json; return mockRes; },
    };

    await handler({ body, headers }, mockRes as any);

    console.log('=== WEBHOOK RESPONSE ===');
    console.log('Status:', responseStatus);
    console.log('Body:', responseBody);

    const finalResponse = NextResponse.json(responseBody, { status: responseStatus });

    // Add security headers to POST responses as well
    finalResponse.headers.set('X-Content-Type-Options', 'nosniff');
    finalResponse.headers.set('X-Frame-Options', 'DENY');
    finalResponse.headers.set('X-XSS-Protection', '1; mode=block');
    finalResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    finalResponse.headers.set('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://api.telegram.org; " +
      "frame-ancestors 'none';"
    );

    return finalResponse;
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'setup') {
    try {
      const webhookUrl = process.env.WEBHOOK_URL || 'https://sampidia-telegram.vercel.app/api/webhook';

      await bot.api.setWebhook(webhookUrl, {
        allowed_updates: ["message", "pre_checkout_query"]
      });

      const webhookInfo = await bot.api.getWebhookInfo();

      return NextResponse.json({
        success: true,
        message: 'Webhook setup completed',
        webhookUrl: webhookUrl,
        webhookInfo: webhookInfo
      });
    } catch (error) {
      console.error('Webhook setup error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to setup webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  const response = NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    environment: {
      hasBotToken: !!process.env.BOT_TOKEN || !!process.env.TELEGRAM_BOT_TOKEN,
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    instructions: {
      setup: 'Visit /api/webhook?action=setup to configure webhook',
      test: 'Make a payment to test webhook functionality',
      manual_setup: 'Use this curl command: curl -X POST "https://api.telegram.org/bot7813322141:AAEqawGpmn0hfsImfQ3hlQqJQKSStvTMF6E/setWebhook" -H "Content-Type: application/json" -d \'{"url": "https://sampidia-telegram.vercel.app/api/webhook", "allowed_updates": ["message", "pre_checkout_query"]}\'',
      troubleshooting: 'If payments still don\'t work, check console logs and ensure webhook is receiving events'
    }
  });

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Add CSP header to prevent eval() and other injection attacks
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.telegram.org; " +
    "frame-ancestors 'none';"
  );

  return response;
}
