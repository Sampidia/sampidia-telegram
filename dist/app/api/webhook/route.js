import { NextResponse } from "next/server";
import { Bot, webhookCallback } from "grammy";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const bot = new Bot(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "");
// Handle pre-checkout queries
bot.on("pre_checkout_query", (ctx) => {
    console.log('Pre-checkout query received:', ctx.preCheckoutQuery);
    return ctx.answerPreCheckoutQuery(true).catch((error) => {
        console.error("answerPreCheckoutQuery failed:", error);
    });
});
// Handle successful payments
bot.on("message:successful_payment", async (ctx) => {
    if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
        console.log('Missing payment data in webhook');
        return;
    }
    try {
        const payment = ctx.message.successful_payment;
        console.log('Payment received via webhook:', payment);
        const payload = JSON.parse(payment.invoice_payload || '{}');
        console.log('Payment payload:', payload);
        // Validate required fields
        const userId = payload.userId || ctx.from.id.toString();
        const telegramId = ctx.from.id.toString();
        const transactionId = payment.telegram_payment_charge_id;
        const amount = payment.total_amount || 0;
        const itemId = payload.itemId || 'unknown';
        console.log('Processing payment data:', {
            userId,
            telegramId,
            transactionId,
            amount,
            itemId
        });
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
        console.log('User created/updated via webhook:', user);
        // Store payment in database using the user's ID
        const savedPayment = await prisma.payment.create({
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
        console.log('Payment saved to database via webhook:', savedPayment);
        console.log('Payment processed successfully via webhook');
        // Send confirmation message to the user
        await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
    }
    catch (error) {
        console.error('Error processing payment via webhook:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            name: error instanceof Error ? error.name : 'Unknown error type'
        });
        // Send a more user-friendly error message
        await ctx.reply(`✅ Payment received! We're processing your purchase and will update your balance shortly.`);
    }
});
// Create webhook handler
const handler = webhookCallback(bot, "next-js");
export async function POST(req) {
    try {
        const body = await req.json();
        const headers = Object.fromEntries(req.headers.entries());
        let responseStatus = 200;
        let responseBody = {};
        const mockRes = {
            end: (cb) => { if (cb)
                cb(); },
            status: (code) => { responseStatus = code; return mockRes; },
            json: (json) => { responseBody = json; return mockRes; },
            send: (json) => { responseBody = json; return mockRes; },
        };
        await handler({ body, headers }, mockRes);
        return NextResponse.json(responseBody, { status: responseStatus });
    }
    catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
