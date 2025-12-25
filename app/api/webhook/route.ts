import { NextRequest, NextResponse } from "next/server";
import { Bot, webhookCallback } from "grammy";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bot = new Bot(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "");

// Handle pre-checkout queries
bot.on("pre_checkout_query", (ctx) => {
  return ctx.answerPreCheckoutQuery(true).catch((error) => {
    console.error("answerPreCheckoutQuery failed:", error);
  });
});

// Payment handling moved to individual route files
// Webhook now only handles pre-checkout queries and forwards to appropriate handlers

// Create webhook handler
const handler = webhookCallback(bot, "next-js");

// Detailed logging for debugging
const logUpdate = (update: any) => {
  console.log('--- Telegram Update ---');
  if (update.message) {
    if (update.message.text) console.log(`Text: ${update.message.text}`);
    if (update.message.successful_payment) console.log('Payment: Received');
    console.log(`From: ${update.message.from?.id} (${update.message.from?.username || 'no username'})`);
  }
  if (update.pre_checkout_query) console.log('Pre-checkout query: Received');
  console.log('----------------------');
};

bot.on("message:successful_payment", async (ctx) => {
  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
    return;
  }

  try {
    const payment = ctx.message.successful_payment;
    const payload = JSON.parse(payment.invoice_payload || '{}');
    const telegramId = ctx.from.id.toString();
    const amount = payment.total_amount || 0;

    console.log(`Processing payment for user ${telegramId}, amount: ${amount}`);

    // Check if payment already exists to prevent double processing
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: payment.telegram_payment_charge_id }
    });

    if (existingPayment) {
      console.log('Payment already processed, skipping.');
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
    await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
  } catch (error) {
    console.error('Error processing payment:', error);
    await ctx.reply(`✅ Payment received! We're processing your purchase and will update your balance shortly.`);
  }
});

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    logUpdate(update);

    // grammY's webhookCallback for next-js expects a request-like object
    // and a response-like object. Next.js 15 App Router handles this differently,
    // so we use the mockRes approach but ensure it's compatible.

    let responseStatus = 200;
    let responseBody: any = {};

    const mockRes = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseBody = data;
        return mockRes;
      },
      end: (data?: any) => {
        if (data && typeof data === 'string') {
          try {
            responseBody = JSON.parse(data);
          } catch {
            responseBody = data;
          }
        }
        return mockRes;
      },
      send: (data: any) => {
        responseBody = data;
        return mockRes;
      }
    };

    // Pass the raw body and headers to grammY
    await handler(req as any, mockRes as any);

    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
